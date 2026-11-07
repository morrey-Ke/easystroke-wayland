import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const DIRECTIONS = ['left', 'right', 'up', 'down'];
const ACTIONS = [...DIRECTIONS, ...DIRECTIONS.flatMap(first =>
    DIRECTIONS.filter(second => second !== first).map(second => `${first}-${second}`))];

function gestureTitle(action) {
    return action.split('-').map(direction => direction[0].toUpperCase() + direction.slice(1)).join(' → ');
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
            description: 'Optional GNOME shortcuts run the same command as the matching gesture. Example: <Control><Alt>Left. Clear a field to disable it.',
        });
        for (const action of ACTIONS) {
            const key = `shortcut-${action}`;
            const row = new Adw.ActionRow({title: `${gestureTitle(action)} action`});
            const entry = new Gtk.Entry({text: settings.get_strv(key)[0] ?? '', placeholder_text: '<Control><Alt>Left', hexpand: true, valign: Gtk.Align.CENTER});
            entry.set_width_chars(28);
            entry.connect('changed', () => {
                const accelerator = entry.get_text().trim();
                settings.set_strv(key, accelerator ? [accelerator] : []);
            });
            row.add_suffix(entry);
            shortcutsGroup.add(row);
        }
        page.add(shortcutsGroup);
        window.add(page);
    }
}
