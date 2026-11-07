# EasyStroke Wayland for GNOME Shell

An Easystroke-inspired mouse-gesture extension for GNOME Shell/Mutter, including Wayland sessions. It uses GNOME Shell's ES-module extension API.

## Features

- Four straight gestures: left, right, up, and down.
- Two-leg gestures: left → right, up → down, and up → left.
- Configurable commands for all seven gestures.
- Optional GNOME keyboard shortcuts for each action; gestures and shortcuts invoke the same command.
- Configurable trigger button and minimum pointer travel.

The recognizer simplifies the pointer path before detecting legs to reduce motion noise. It accepts only the listed one- and two-leg patterns. The default trigger is mouse button 3 (right button); its press, motion, and release are consumed while tracking.

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

In preferences, configure commands for each gesture. For example, set the left-right command to `notify-send 'Gesture test' 'Left then right'` (requires `libnotify`). Enter keyboard accelerators such as `<Control><Alt>Left` in the matching shortcut row. Clear a command to disable its action, or clear a shortcut field to unregister its shortcut. Commands are user-configured shell commands; only enter commands you trust.

Hold the trigger button and draw a clear path with legs in the named directions. For left-right, draw a horizontal leg left then reverse to the right; for up-down, draw upward and reverse downward; for up-left, draw upward then left. Each path must exceed the minimum total distance and have a visible turn.

## Development checks

```sh
python -m json.tool easystroke-wayland@morrey-ke/metadata.json >/dev/null
glib-compile-schemas --strict --dry-run easystroke-wayland@morrey-ke/schemas
```

Test on each supported GNOME Shell version in `metadata.json`; this repository does not include an automated Shell integration environment.
