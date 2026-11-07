import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const DIRECTIONS = ['left', 'right', 'up', 'down'];
const ACTIONS = [...DIRECTIONS, ...DIRECTIONS.flatMap(first =>
    DIRECTIONS.filter(second => second !== first).map(second => `${first}-${second}`))];

function gestureTitle(action) {
    return action.split('-').map(direction =>
        direction[0].toUpperCase() + direction.slice(1)).join(' → ');
}

function isModifierKey(keyval) {
    return [
        Gdk.KEY_Control_L, Gdk.KEY_Control_R,
        Gdk.KEY_Shift_L, Gdk.KEY_Shift_R,
        Gdk.KEY_Alt_L, Gdk.KEY_Alt_R,
        Gdk.KEY_Meta_L, Gdk.KEY_Meta_R,
        Gdk.KEY_Super_L, Gdk.KEY_Super_R,
        Gdk.KEY_Hyper_L, Gdk.KEY_Hyper_R,
    ].includes(keyval);
}

function addShortcutCapture(entry, settings, key) {
    const controller = new Gtk.EventControllerKey();
    controller.set_propagation_phase(Gtk.PropagationPhase.CAPTURE);
    controller.connect('key-pressed', (_controller, keyval, _keycode, state) => {
        if (keyval === Gdk.KEY_BackSpace || keyval === Gdk.KEY_Delete) {
            entry.set_text('');
            settings.set_strv(key, []);
            return true;
        }

        // Escape cancels capture without changing the saved keybinding.
        if (keyval === Gdk.KEY_Escape || isModifierKey(keyval))
            return true;

        const modifiers = state & Gtk.accelerator_get_default_mod_mask();
        if (!Gtk.accelerator_valid(keyval, modifiers))
            return true;

        const accelerator = Gtk.accelerator_name(keyval, modifiers);
        if (accelerator) {
            entry.set_text(accelerator);
            settings.set_strv(key, [accelerator]);
        }
        return true;
    });
    entry.add_controller(controller);
}

export default class EasyStrokeWaylandPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage({
            title: 'Gestures',
            icon_name: 'input-mouse-symbolic',
        });

        const behaviorGroup = new Adw.PreferencesGroup({
            title: 'Gesture behavior',
            description: 'Choose the mouse button and minimum pointer travel for a gesture.',
        });
        const buttonRow = new Adw.ActionRow({
            title: 'Trigger button',
            subtitle: '3 is the right mouse button',
        });
        const buttonSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 16,
                step_increment: 1,
                page_increment: 1,
                value: settings.get_int('trigger-button'),
            }),
            numeric: true,
            valign: Gtk.Align.CENTER,
        });
        buttonSpin.connect('value-changed', () =>
            settings.set_int('trigger-button', buttonSpin.get_value_as_int()));
        buttonRow.add_suffix(buttonSpin);
        behaviorGroup.add(buttonRow);

        const thresholdRow = new Adw.ActionRow({
            title: 'Minimum gesture distance',
            subtitle: 'Minimum total pointer travel in pixels',
        });
        const thresholdSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 300,
                step_increment: 5,
                page_increment: 20,
                value: settings.get_int('trigger-threshold'),
            }),
            numeric: true,
            valign: Gtk.Align.CENTER,
        });
        thresholdSpin.connect('value-changed', () =>
            settings.set_int('trigger-threshold', thresholdSpin.get_value_as_int()));
        thresholdRow.add_suffix(thresholdSpin);
        behaviorGroup.add(thresholdRow);
        page.add(behaviorGroup);

        const actionsGroup = new Adw.PreferencesGroup({
            title: 'Gesture actions',
            description: 'Each gesture can run a command, a keyboard shortcut, or both. Leave either field blank to disable that option.',
        });
        for (const action of ACTIONS) {
            const row = new Adw.ActionRow({title: `${gestureTitle(action)} gesture`});
            const fields = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 8,
                hexpand: true,
                valign: Gtk.Align.CENTER,
            });
            const commandEntry = new Gtk.Entry({
                text: settings.get_string(`action-${action}`),
                placeholder_text: 'Command (optional)',
                hexpand: true,
                width_chars: 24,
            });
            commandEntry.set_tooltip_text('Shell command to run for this gesture');
            commandEntry.connect('changed', () =>
                settings.set_string(`action-${action}`, commandEntry.get_text()));

            const shortcutKey = `shortcut-${action}`;
            const shortcutEntry = new Gtk.Entry({
                text: settings.get_strv(shortcutKey)[0] ?? '',
                placeholder_text: 'Shortcut (optional)',
                editable: false,
                can_focus: true,
                width_chars: 18,
            });
            shortcutEntry.set_tooltip_text('Focus and press a key combination; Backspace/Delete clears it');
            addShortcutCapture(shortcutEntry, settings, shortcutKey);

            fields.append(commandEntry);
            fields.append(shortcutEntry);
            row.add_suffix(fields);
            actionsGroup.add(row);
        }
        page.add(actionsGroup);
        window.add(page);
    }
}
