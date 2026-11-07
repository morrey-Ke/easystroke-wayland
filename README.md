# EasyStroke Wayland for GNOME Shell

A lightweight Easystroke-style gesture extension designed for Mutter/Wayland on Nyarch Linux and other GNOME-based desktops.

This project is intentionally simple and realistic for a GNOME Shell extension: it captures global pointer motion while a configured mouse button is held, classifies the resulting stroke, and runs a user-configurable command when the gesture is recognized.

Features
- Wayland/Mutter friendly input capture through GNOME Shell event handling
- Gesture trigger via a configurable mouse button
- Recognizes simple directional gestures: left, right, up, down
- User-configurable commands via GNOME settings
- Optional notification when a gesture is detected

Important note
- Full Easystroke parity with X11 is not possible in the same way under Wayland because the desktop compositor controls pointer capture and global input.
- The practical Mutter-compatible approach is a GNOME Shell extension that listens to compositor events and triggers commands.
- This implementation is intentionally safe and compatible with the extension model used by GNOME Shell.

Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/morrey-Ke/easystroke-wayland.git
   cd easystroke-wayland
   ```

2. Copy the extension directory into GNOME Shell's extension directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions
   cp -r easystroke-wayland@morrey-ke ~/.local/share/gnome-shell/extensions/
   ```

3. Restart GNOME Shell or log out/in.

4. Enable the extension with GNOME Extensions or the Extensions app.

5. Open the settings UI to adjust the trigger button and commands.

Default gesture behavior
- Right mouse button drag -> gesture begins
- Drag left -> run command configured for left
- Drag right -> run command configured for right
- Drag up -> run command configured for up
- Drag down -> run command configured for down

Example default commands
- left: `gnome-terminal --`
- right: `xdg-open https://github.com/morrey-Ke/easystroke-wayland`
- up: `gnome-control-center`
- down: `nautilus ~`

You may want to replace them with your own launchers for terminal, browser, app switcher, or window actions.

Repository structure
```text
.
├── easystroke-wayland@morrey-ke/
│   ├── metadata.json
│   ├── extension.js
│   ├── prefs.js
│   ├── stylesheet.css
│   └── schemas/
│       └── org.gnome.shell.extensions.easystroke-wayland.gschema.xml
├── LICENSE
├── README.md
└── .gitignore
```

Status
This is a foundation for a Mutation/Mutter-compatible Easystroke replacement and is suitable as a base for extending gesture detection, command profiles, or custom actions.
