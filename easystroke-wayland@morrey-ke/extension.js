import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const DIRECTIONS = ['left', 'right', 'up', 'down'];

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
        this._stageCapturedEventId = global.stage.connect(
            'captured-event',
            (_actor, event) => this._onCapturedEvent(event)
        );

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
        if (event.get_button() !== this._triggerButton)
            return Clutter.EVENT_PROPAGATE;

        const [x, y] = event.get_coords();
        this._gesture = {
            button: this._triggerButton,
            points: [{x, y}],
        };

        // Consume the initiating press so the trigger button does not activate
        // the clicked control underneath the gesture.
        return Clutter.EVENT_STOP;
    }

    _onMotion(event) {
        if (!this._gesture)
            return Clutter.EVENT_PROPAGATE;

        const [x, y] = event.get_coords();
        this._gesture.points.push({x, y});
        return Clutter.EVENT_STOP;
    }

    _onButtonRelease(event) {
        if (!this._gesture || event.get_button() !== this._gesture.button)
            return Clutter.EVENT_PROPAGATE;

        const gesture = this._classifyGesture(this._gesture.points);
        this._gesture = null;

        if (gesture)
            this._runAction(gesture);

        return Clutter.EVENT_STOP;
    }

    _classifyGesture(points) {
        if (points.length < 2)
            return null;

        const start = points[0];
        const end = points[points.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        if (Math.hypot(dx, dy) < this._threshold)
            return null;

        if (Math.abs(dx) > Math.abs(dy) * 1.25)
            return dx < 0 ? 'left' : 'right';

        if (Math.abs(dy) > Math.abs(dx) * 1.25)
            return dy < 0 ? 'up' : 'down';

        return null;
    }

    _runAction(direction) {
        if (!DIRECTIONS.includes(direction))
            return;

        const command = this._settings.get_string(`action-${direction}`).trim();
        if (!command)
            return;

        try {
            // Commands are explicitly user-configured in extension preferences.
            Gio.Subprocess.new(
                ['/bin/sh', '-c', command],
                Gio.SubprocessFlags.NONE
            );
        } catch (error) {
            console.error(`[${this.uuid}] Could not launch ${direction} action: ${error.message}`);
        }
    }
}
