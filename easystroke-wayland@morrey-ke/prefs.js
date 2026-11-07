const { Adw, Gio, Gtk } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function getSettings() {
    const schemaDir = Me.dir.get_child('schemas');
    if (!schemaDir.query_exists(null))
        throw new Error('Schema directory not found');

    const source = Gio.SettingsSchemaSource.new_from_directory(
        schemaDir.get_path(),
        Gio.SettingsSchemaSource.get_default(),
        false,
        null
    );

    const schema = source.lookup('org.gnome.shell.extensions.easystroke-wayland', true);
    if (!schema)
        throw new Error('Schema not found');

    return new Gio.Settings({ settings_schema: schema });
}

function buildPrefsWidget() {
    const settings = getSettings();
    const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 12,
        margin_top: 18,
        margin_bottom: 18,
        margin_start: 18,
        margin_end: 18,
        hexpand: true,
        vexpand: true,
    });

    const heading = new Gtk.Label({
        label: '<b>EasyStroke Wayland</b>',
        use_markup: true,
        xalign: 0,
    });
    box.append(heading);

    const triggerButton = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({ lower: 1, upper: 16, step_increment: 1, value: settings.get_int('trigger-button') }),
        numeric: true,
    });
    triggerButton.connect('value-changed', () => {
        settings.set_int('trigger-button', triggerButton.get_value_as_int());
    });

    const threshold = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({ lower: 10, upper: 300, step_increment: 5, value: settings.get_int('trigger-threshold') }),
        numeric: true,
    });
    threshold.connect('value-changed', () => {
        settings.set_int('trigger-threshold', threshold.get_value_as_int());
    });

    const rows = [
        { label: 'Gesture trigger button', widget: triggerButton },
        { label: 'Minimum gesture distance', widget: threshold },
    ];

    rows.forEach(({ label, widget }) => {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12, hexpand: true });
        const labelWidget = new Gtk.Label({ label, xalign: 0, hexpand: true });
        row.append(labelWidget);
        row.append(widget);
        box.append(row);
    });

    const note = new Gtk.Label({
        label: 'Left-handed mouse mode is detected automatically; the configured button is interpreted as the logical button, not the physical one.',
        xalign: 0,
        wrap: true,
        selectable: true,
        margin_top: 4,
    });
    box.append(note);

    const commands = [
        { key: 'action-left', label: 'Left command' },
        { key: 'action-right', label: 'Right command' },
        { key: 'action-up', label: 'Up command' },
        { key: 'action-down', label: 'Down command' },
    ];

    commands.forEach(({ key, label }) => {
        const entry = new Gtk.Entry({ text: settings.get_string(key) });
        entry.connect('changed', () => settings.set_string(key, entry.get_text()));

        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 12, hexpand: true });
        const labelWidget = new Gtk.Label({ label, xalign: 0, hexpand: true });
        row.append(labelWidget);
        row.append(entry);
        box.append(row);
    });

    return box;
}

function init() {
    return new Gtk.Box();
}

function buildPrefs() {
    return buildPrefsWidget();
}
