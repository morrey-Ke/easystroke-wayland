# EasyStroke Wayland for GNOME Shell

An Easystroke-inspired mouse-gesture extension for GNOME Shell/Mutter on Wayland.

## Firefox and Floorp actions

To use a gesture for browser actions such as opening a tab, going back/forward, or reloading, install the companion bridge described in [`browser-bridge/README.md`](browser-bridge/README.md). Set the gesture's command to `browser:new-tab`, `browser:back`, `browser:forward`, `browser:reload`, `browser:close-tab`, or `browser:new-window`. The focused Firefox or Floorp window receives the action through WebExtension APIs; no fake keyboard input is used.

## Install the GNOME extension

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

On Wayland, log out and back in after installing or updating extension code.

## Other gesture commands

Any gesture command that is not one of the `browser:` actions is run as a shell command. Only enter commands you trust.
