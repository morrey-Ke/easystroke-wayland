# EasyStroke Wayland for GNOME Shell

An Easystroke-inspired mouse-gesture extension for GNOME Shell/Mutter on Wayland, using GNOME Shell's ES-module extension API.

## Features

- Four straight gestures: left, right, up, and down.
- 12 ordered two-direction combinations with different directions (4 × 3). Repeated pairs such as left → left and up → up are excluded.
- Custom commands and optional GNOME keyboard shortcuts for each gesture.
- Configurable trigger button and minimum total pointer travel.

Draw a two-leg gesture with a clear turn while holding the trigger button. The default trigger is mouse button 3 (right button); its press, motion, and release are consumed while tracking.

## Wayland limitation

This works only in GNOME Shell/Mutter sessions; a regular Wayland application cannot globally capture input across other compositors. Shell event capture and input behavior may vary between GNOME versions.

## Install from a clone

```sh
git clone https://github.com/morrey-Ke/easystroke-wayland.git
cd easystroke-wayland
EXT="$HOME/.local/share/gnome-shell/extensions/easystroke-wayland@morrey-ke"
mkdir -p "$EXT"
cp -r easystroke-wayland@morrey-ke/. "$EXT/"
glib-compile-schemas --strict "$EXT/schemas"
gnome-extensions enable easystroke-wayland@morrey-ke
gnome-extensions prefs easystroke-wayland@morrey-ke
```

If installing for the first time, log out and back in if the extension is not discovered. On Wayland, a full log out/in is the reliable way to restart GNOME Shell after code changes.

## Configure and test

Configure gesture commands and optional shortcuts in preferences. For a harmless test use `notify-send 'Gesture test' 'Left then right'` (requires `libnotify`). Shortcut accelerators use syntax such as `<Control><Alt>Left`; clear a shortcut field to disable it. Commands are user-configured shell commands; only enter commands you trust.

Draw a distinct two-leg path for combinations such as left → right or up → left. Repeated directions (same direction twice) are not supported.

## Development checks

```sh
python -m json.tool easystroke-wayland@morrey-ke/metadata.json >/dev/null
glib-compile-schemas --strict --dry-run easystroke-wayland@morrey-ke/schemas
```

Test on the GNOME Shell versions listed in `metadata.json`; this repository does not include an automated Shell integration environment.
