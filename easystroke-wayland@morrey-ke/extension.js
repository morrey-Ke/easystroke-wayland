import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const DIRECTIONS = ['left', 'right', 'up', 'down'];
const ACTIONS = [...DIRECTIONS, ...DIRECTIONS.flatMap(first =>
    DIRECTIONS.map(second => `${first}-${second}`))];
const PAUSE_THRESHOLD_MS = 350;

export default class EasyStrokeWaylandExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._triggerButton = this._settings.get_int('trigger-button');
        this._threshold = this._settings.get_int('trigger-threshold');
        this._gesture = null;
        this._settingsChangedId = this._settings.connect('changed', () => {
            this._triggerButton = this._settings.get_int('trigger-button');
            this._threshold = this._settings.get_int('trigger-threshold');
        });
        this._stageCapturedEventId = global.stage.connect('captured-event', (_actor, event) => this._onCapturedEvent(event));

        for (const action of ACTIONS) {
            Main.wm.addKeybinding(
                `shortcut-${action}`, this._settings, Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.ALL, () => this._runAction(action)
            );
        }
        console.debug(`[${this.uuid}] enabled`);
    }

    disable() {
        if (this._stageCapturedEventId) {
            global.stage.disconnect(this._stageCapturedEventId);
            this._stageCapturedEventId = 0;
        }
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
        for (const action of ACTIONS)
            Main.wm.removeKeybinding(`shortcut-${action}`);
        this._gesture = null;
        this._settings = null;
        console.debug(`[${this.uuid}] disabled`);
    }

    _onCapturedEvent(event) {
        switch (event.type()) {
        case Clutter.EventType.BUTTON_PRESS:
            return this._onButtonPress(event);
        case Clutter.EventType.MOTION:
            return this._onMotion(event);
        case Clutter.EventType.BUTTON_RELEASE:
            return this._onButtonRelease(event);
        default:
            return Clutter.EVENT_PROPAGATE;
        }
    }

    _onButtonPress(event) {
        const button = event.get_button();
        const leftHanded = this._mouseSettings?.get_boolean('left-handed') ?? false;
        const isTrigger = button === this._triggerButton ||
            (leftHanded && ((button === 1 && this._triggerButton === 3) ||
                (button === 3 && this._triggerButton === 1)));
        if (!isTrigger)
            return Clutter.EVENT_PROPAGATE;

        const [x, y] = event.get_coords();
        this._gesture = {button, points: [{x, y, time: event.get_time()}]};
        return Clutter.EVENT_STOP;
    }

    _onMotion(event) {
        if (!this._gesture)
            return Clutter.EVENT_PROPAGATE;
        const [x, y] = event.get_coords();
        const points = this._gesture.points;
        const previous = points[points.length - 1];
        if (Math.hypot(x - previous.x, y - previous.y) >= 2) {
            points.push({x, y, time: event.get_time()});
            if (points.length > 2000)
                points.splice(1, points.length - 1500);
        }
        return Clutter.EVENT_STOP;
    }

    _onButtonRelease(event) {
        if (!this._gesture || event.get_button() !== this._gesture.button)
            return Clutter.EVENT_PROPAGATE;
        const action = this._classifyGesture(this._gesture.points);
        this._gesture = null;
        if (action)
            this._runAction(action);
        return Clutter.EVENT_STOP;
    }

    _pointLineDistance(point, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lengthSquared = dx * dx + dy * dy;
        if (lengthSquared === 0)
            return Math.hypot(point.x - start.x, point.y - start.y);
        const t = Math.max(0, Math.min(1,
            ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
        return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
    }

    _simplify(points, tolerance) {
        if (points.length <= 2)
            return points;
        const start = points[0];
        const end = points[points.length - 1];
        let farthestIndex = -1;
        let farthestDistance = tolerance;
        for (let i = 1; i < points.length - 1; i++) {
            const distance = this._pointLineDistance(points[i], start, end);
            if (distance > farthestDistance) {
                farthestDistance = distance;
                farthestIndex = i;
            }
        }
        if (farthestIndex === -1)
            return [start, end];
        const first = this._simplify(points.slice(0, farthestIndex + 1), tolerance);
        const second = this._simplify(points.slice(farthestIndex), tolerance);
        return [...first.slice(0, -1), ...second];
    }

    _directionsForChunk(points) {
        const corners = this._simplify(points, Math.max(5, this._threshold * 0.2));
        const directions = [];
        for (let i = 1; i < corners.length; i++) {
            const dx = corners[i].x - corners[i - 1].x;
            const dy = corners[i].y - corners[i - 1].y;
            if (Math.hypot(dx, dy) < Math.max(8, this._threshold * 0.25))
                continue;
            const direction = Math.abs(dx) >= Math.abs(dy)
                ? (dx < 0 ? 'left' : 'right')
                : (dy < 0 ? 'up' : 'down');
            if (directions.at(-1) !== direction)
                directions.push(direction);
        }
        return directions;
    }

    _classifyGesture(points) {
        if (points.length < 2)
            return null;
        let pathLength = 0;
        for (let i = 1; i < points.length; i++)
            pathLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        if (pathLength < this._threshold)
            return null;

        const chunks = [[]];
        for (let i = 0; i < points.length; i++) {
            if (i > 0 && points[i].time - points[i - 1].time >= PAUSE_THRESHOLD_MS)
                chunks.push([points[i - 1]]);
            chunks[chunks.length - 1].push(points[i]);
        }
        const directions = [];
        for (const chunk of chunks) {
            for (const direction of this._directionsForChunk(chunk)) {
                if (directions.at(-1) !== direction)
                    directions.push(direction);
            }
        }
        if (directions.length < 1 || directions.length > 2)
            return null;
        const action = directions.join('-');
        return ACTIONS.includes(action) ? action : null;
    }

    _runAction(action) {
        if (!ACTIONS.includes(action))
            return;
        const command = this._settings.get_string(`action-${action}`).trim();
        if (!command)
            return;
        try {
            Gio.Subprocess.new(['/bin/sh', '-c', command], Gio.SubprocessFlags.NONE);
        } catch (error) {
            console.error(`[${this.uuid}] Could not launch ${action} action: ${error.message}`);
        }
    }
}
