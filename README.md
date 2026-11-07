# EasyStroke Wayland for GNOME Shell

An Easystroke-inspired mouse-gesture extension for GNOME Shell/Mutter on Wayland, using GNOME Shell's ES-module extension API.

## Features

- Four straight gestures: left, right, up, and down.
- All 16 ordered two-direction combinations (4 × 4), including repeated directions such as left → left.
- Custom commands and optional GNOME keyboard shortcuts for each gesture.
- Configurable trigger button and minimum total pointer travel.

Draw a two-leg gesture with a clear turn. To enter the same direction twice (for example left → left), pause briefly between the two strokes while keeping the trigger button held. The pause threshold is 350 ms. The gesture trigger defaults to mouse button 3 (right button), and its press, motion, and release are consumed while tracking.

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

Set gesture commands and optional shortcuts in preferences. For a harmless test, set an action to `notify-send 'Gesture test' 'Left then right'` (requires `libnotify`). Shortcut accelerators use syntax such as `<Control><Alt>Left`; clear a shortcut field to disable it. Commands are user-configured shell commands; only enter commands you trust.

For the repeated-direction combinations, pause for at least 350 ms between strokes while holding the mouse button. For other combinations, make a distinct turn in the indicated directions. Gestures are rejected if they contain more than two recognized directional legs.

## Development checks

```sh
python -m json.tool easystroke-wayland@morrey-ke/metadata.json >/dev/null
glib-compile-schemas --strict --dry-run easystroke-wayland@morrey-ke/schemas
```

Test on the GNOME Shell versions listed in `metadata.json`; this repository does not include an automated Shell integration environment.
