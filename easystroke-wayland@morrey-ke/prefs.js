import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const DIRECTIONS = ['left', 'right', 'up', 'down'];
const ACTIONS = [...DIRECTIONS, ...DIRECTIONS.flatMap(first =>
    DIRECTIONS.filter(second => second !== first).map(second => `${first}-${second}`))];

function gestureTitle(action) {
    return action.split('-').map(direction => direction[0].toUpperCase() + direction.slice(1)).join(' → ');
}

function acceleratorFromEvent(event) {
    const [success, keyval] = event.get_keyval();
    if (!success)
        return null;

    const state = event.get_state();
    const mask = Gtk.accelerator_get_default_mod_mask();
    const modifiers = state & mask;
    const key = Gdk.keyval_name(keyval);

    if (!key)
        return null;

    const isModifier = [
        Gdk.KEY_Control_L, Gdk.KEY_Control_R,
        Gdk.KEY_Shift_L, Gdk.KEY_Shift_R,
        Gdk.KEY_Alt_L, Gdk.KEY_Alt_R,
        Gdk.KEY_Meta_L, Gdk.KEY_Meta_R,
        Gdk.KEY_Super_L, Gdk.KEY_Super_R,
    ].includes(keyval);

    if (isModifier)
        return null;

    return Gtk.accelerator_name(keyval, modifiers);
}

export default class EasyStrokeWaylandPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage({title: 'Gestures', icon_name: 'input-mouse-symbolic'});
        const behaviorGroup = new Adw.PreferencesGroup({
            title: 'Gesture behavior',
            description: 'Choose the mouse button and minimum pointer travel for a gesture.',
        });
        const buttonRow = new Adw.ActionRow({title: 'Trigger button', subtitle: '3 is the right mouse button'});
        const buttonSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({lower: 1, upper: 16, step_increment: 1, page_increment: 1, value: settings.get_int('trigger-button')}),
            numeric: true, valign: Gtk.Align.CENTER,
        });
        buttonSpin.connect('value-changed', () => settings.set_int('trigger-button', buttonSpin.get_value_as_int()));
        buttonRow.add_suffix(buttonSpin);
        behaviorGroup.add(buttonRow);
        const thresholdRow = new Adw.ActionRow({title: 'Minimum gesture distance', subtitle: 'Minimum total pointer travel in pixels'});
        const thresholdSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({lower: 10, upper: 300, step_increment: 5, page_increment: 20, value: settings.get_int('trigger-threshold')}),
            numeric: true, valign: Gtk.Align.CENTER,
        });
        thresholdSpin.connect('value-changed', () => settings.set_int('trigger-threshold', thresholdSpin.get_value_as_int()));
        thresholdRow.add_suffix(thresholdSpin);
        behaviorGroup.add(thresholdRow);
        page.add(behaviorGroup);

        const actionsGroup = new Adw.PreferencesGroup({
            title: 'Gesture actions',
            description: 'Configure commands for four cardinal gestures and 12 ordered two-direction combinations with different directions.',
        });
        for (const action of ACTIONS) {
            const row = new Adw.ActionRow({title: `${gestureTitle(action)} gesture`});
            const entry = new Gtk.Entry({text: settings.get_string(`action-${action}`), placeholder_text: 'Shell command (leave blank to disable)', hexpand: true, valign: Gtk.Align.CENTER});
            entry.set_width_chars(32);
            entry.connect('changed', () => settings.set_string(`action-${action}`, entry.get_text()));
            row.add_suffix(entry);
            actionsGroup.add(row);
        }
        page.add(actionsGroup);

        const shortcutsGroup = new Adw.PreferencesGroup({
            title: 'Keyboard shortcuts',
            description: 'Click a shortcut field, then press the key combination you want (for example Ctrl+R or Alt+Left). Press Backspace to clear it.',
        });
        for (const action of ACTIONS) {
            const key = `shortcut-${action}`;
            const row = new Adw.ActionRow({title: `${gestureTitle(action)} action`});
            const entry = new Gtk.Entry({
                text: settings.get_strv(key)[0] ?? '',
                placeholder_text: 'Click and press keys…',
                editable: false,
                can_focus: true,
                hexpand: true,
                valign: Gtk.Align.CENTER,
            });
            entry.set_width_chars(28);
            entry.connect('key-press-event', (_widget, event) => {
                const keyval = event.get_keyval()[1];
                if (keyval === Gdk.KEY_BackSpace || keyval === Gdk.KEY_Delete) {
                    entry.set_text('');
                    settings.set_strv(key, []);
                    return true;
                }
                const accelerator = acceleratorFromEvent(event);
                if (!accelerator)
                    return true;
                entry.set_text(accelerator);
                settings.set_strv(key, [accelerator]);
                return true;
            });
            row.add_suffix(entry);
            shortcutsGroup.add(row);
        }
        page.add(shortcutsGroup);
        window.add(page);
    }
}
