# EasyStroke Wayland for GNOME Shell

An Easystroke-inspired mouse-gesture extension for GNOME Shell/Mutter, including Wayland sessions. It uses GNOME Shell's supported JavaScript ES modules and extension lifecycle (`Extension` and `ExtensionPreferences`).

## What it does

- Watches stage-level pointer events while the configured trigger button is held.
- Recognizes four straight gestures: left, right, up, and down.
- Runs the shell command configured for a recognized gesture.
- Provides preferences for the trigger button, minimum travel distance, and actions.

### Wayland limitation

On Wayland, a regular application cannot globally capture or synthesize input like an X11 utility. This extension listens to events exposed by GNOME Shell/Mutter, so it only applies to GNOME Shell sessions and does not provide gesture handling in other compositors. Shell event capture and input behavior may also change between GNOME versions.

## Requirements

- GNOME Shell 45–48 (as declared in `metadata.json`)
- `glib-compile-schemas` to compile the GSettings schema

## Install from a clone

```sh
git clone https://github.com/morrey-Ke/easystroke-wayland.git
cd easystroke-wayland
install -d "$HOME/.local/share/gnome-shell/extensions/easystroke-wayland@morrey-ke/schemas"
cp -r easystroke-wayland@morrey-ke/. "$HOME/.local/share/gnome-shell/extensions/easystroke-wayland@morrey-ke/"
glib-compile-schemas "$HOME/.local/share/gnome-shell/extensions/easystroke-wayland@morrey-ke/schemas"
```

Then log out and back in if needed, enable **EasyStroke Wayland** in the Extensions app, and open its preferences. On Wayland, use a full log out/in when restarting GNOME Shell.

## Usage and safety

The default trigger is mouse button 3 (right button), with a 40-pixel minimum gesture. The default commands are examples; review and edit them in preferences before use. Gesture commands are user-configured shell commands, so only enter commands you trust. Clear an action field to disable that direction.

## Development checks

```sh
python -m json.tool easystroke-wayland@morrey-ke/metadata.json >/dev/null
glib-compile-schemas --strict --dry-run easystroke-wayland@morrey-ke/schemas
```

The extension should still be tested in each GNOME Shell version listed in the metadata; this repository does not currently have an automated GNOME Shell integration test environment.
