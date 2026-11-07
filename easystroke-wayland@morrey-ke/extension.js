const { Clutter, Gio, GLib } = imports.gi;
const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const DEFAULT_ACTIONS = {
    left: 'gnome-terminal --',
    right: 'xdg-open https://github.com/morrey-Ke/easystroke-wayland',
    up: 'gnome-control-center',
    down: 'nautilus ~',
};

class EasyStrokeWayland {
    constructor() {
        this._settings = null;
        this._stageHandler = null;
        this._gestureActive = false;
        this._gestureStart = null;
        this._points = [];
        this._triggerButton = 3;
        this._threshold = 40;
    }

    _log(message) {
        log(`[EasyStrokeWayland] ${message}`);
    }

    _readSettings() {
        if (!this._settings)
            this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.easystroke-wayland');

        this._triggerButton = this._settings.get_int('trigger-button');
        this._threshold = this._settings.get_int('trigger-threshold');
    }

    _handleSettingsChange() {
        this._readSettings();
    }

    _executeAction(name) {
        const actions = {
            left: this._settings.get_string('action-left'),
            right: this._settings.get_string('action-right'),
            up: this._settings.get_string('action-up'),
            down: this._settings.get_string('action-down'),
        };

        const command = actions[name] || DEFAULT_ACTIONS[name];
        if (!command || command.trim() === '')
            return;

        try {
            GLib.spawn_command_line_async(command);
            this._log(`Executed gesture action '${name}': ${command}`);
        } catch (e) {
            this._log(`Failed to execute ${name}: ${e.message}`);
        }
    }

    _classifyGesture(points) {
        if (!points || points.length < 2)
            return null;

        const start = points[0];
        const end = points[points.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.hypot(dx, dy);

        if (distance < this._threshold)
            return null;

        if (Math.abs(dx) > Math.abs(dy) * 1.25) {
            return dx < 0 ? 'left' : 'right';
        }

        if (Math.abs(dy) > Math.abs(dx) * 1.25) {
            return dy < 0 ? 'up' : 'down';
        }

        return null;
    }

    _maybeStartGesture(event) {
        const button = event.get_button();
        if (button !== this._triggerButton)
            return Clutter.EVENT_PROPAGATE;

        const [x, y] = event.get_coords();
        this._gestureActive = true;
        this._gestureStart = { x, y };
        this._points = [{ x, y }];
        this._log(`Gesture started with button ${button} at (${x}, ${y})`);
        return Clutter.EVENT_STOP;
    }

    _maybeTrackGesture(event) {
        if (!this._gestureActive)
            return Clutter.EVENT_PROPAGATE;

        const [x, y] = event.get_coords();
        this._points.push({ x, y });
        return Clutter.EVENT_PROPAGATE;
    }

    _maybeFinishGesture(event) {
        if (!this._gestureActive)
            return Clutter.EVENT_PROPAGATE;

        const gesture = this._classifyGesture(this._points);
        if (gesture)
            this._executeAction(gesture);

        this._gestureActive = false;
        this._gestureStart = null;
        this._points = [];
        return Clutter.EVENT_STOP;
    }

    _onCapturedEvent(actor, event) {
        const type = event.type();

        if (type === Clutter.EventType.BUTTON_PRESS) {
            return this._maybeStartGesture(event);
        }

        if (type === Clutter.EventType.MOTION && this._gestureActive) {
            return this._maybeTrackGesture(event);
        }

        if (type === Clutter.EventType.BUTTON_RELEASE && this._gestureActive) {
            return this._maybeFinishGesture(event);
        }

        return Clutter.EVENT_PROPAGATE;
    }

    enable() {
        this._readSettings();

        if (this._stageHandler)
            return;

        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.easystroke-wayland');
        this._settings.connect('changed', () => this._handleSettingsChange());

        this._stageHandler = global.stage.connect('captured-event', (actor, event) => this._onCapturedEvent(actor, event));
        this._log('Extension enabled');
    }

    disable() {
        if (this._stageHandler) {
            global.stage.disconnect(this._stageHandler);
            this._stageHandler = null;
        }

        this._gestureActive = false;
        this._points = [];
        this._gestureStart = null;
        this._log('Extension disabled');
    }
}

function init() {
    return new EasyStrokeWayland();
}
