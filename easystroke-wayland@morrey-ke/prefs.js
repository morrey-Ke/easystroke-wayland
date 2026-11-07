import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SETTINGS_SCHEMA = 'org.gnome.shell.extensions.easystroke-wayland';

export default class EasyStrokeWaylandPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings(SETTINGS_SCHEMA);
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
        buttonSpin.connect('value-changed', () => {
            settings.set_int('trigger-button', buttonSpin.get_value_as_int());
        });
        buttonRow.add_suffix(buttonSpin);
        behaviorGroup.add(buttonRow);

        const thresholdRow = new Adw.ActionRow({
            title: 'Minimum gesture distance',
            subtitle: 'Pointer travel in pixels before a gesture is recognized',
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
        thresholdSpin.connect('value-changed', () => {
            settings.set_int('trigger-threshold', thresholdSpin.get_value_as_int());
        });
        thresholdRow.add_suffix(thresholdSpin);
        behaviorGroup.add(thresholdRow);
        page.add(behaviorGroup);

        const actionsGroup = new Adw.PreferencesGroup({
            title: 'Actions',
            description: 'Shell commands run when the corresponding gesture is recognized.',
        });

        for (const direction of ['left', 'right', 'up', 'down']) {
            const row = new Adw.ActionRow({title: `${direction[0].toUpperCase()}${direction.slice(1)} gesture`});
            const entry = new Gtk.Entry({
                text: settings.get_string(`action-${direction}`),
                placeholder_text: 'Leave blank to disable this action',
                hexpand: true,
                valign: Gtk.Align.CENTER,
            });
            entry.set_width_chars(28);
            entry.connect('changed', () => {
                settings.set_string(`action-${direction}`, entry.get_text());
            });
            row.add_suffix(entry);
            actionsGroup.add(row);
        }

        page.add(actionsGroup);
        window.add(page);
    }
}
