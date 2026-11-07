# Firefox and Floorp companion bridge

This companion routes browser actions from the GNOME extension to the active Firefox or Floorp window. It uses a WebExtension and the browsers' native-messaging API; it does not synthesize keystrokes or depend on Firefox being run under XWayland.

## Install the native host

From the repository root, run:

```sh
bash browser-bridge/install-host.sh
```

This installs the Python native host and user-level native-messaging manifests for Firefox (`~/.mozilla/native-messaging-hosts`) and Floorp (`~/.floorp/native-messaging-hosts`). No system-wide privileges are required.

## Install the browser add-on

In Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on…**, and select `browser-bridge/webextension/manifest.json` from this checkout. Repeat in Floorp using `about:debugging` if supported by that build. Temporary add-ons are removed when the browser exits, so load it again after restarting. For permanent use, package/sign the WebExtension or install it through a supported add-on distribution channel.

Keep the add-on loaded in the browser you want to control. Gestures are routed according to the focused GNOME window's WM_CLASS. If Firefox and Floorp are both open, the focused one receives the action.

## Configure gesture commands

Set a gesture's command field to one of these exact values:

- `browser:new-tab`
- `browser:back`
- `browser:forward`
- `browser:reload`
- `browser:close-tab`
- `browser:new-window`

For example, set the Left gesture command to `browser:new-tab` and Right to `browser:back`. These commands invoke the browser tabs/windows APIs on the active tab; they do not send a shortcut to the page. Other commands continue to run as shell commands as before.

The companion currently supports Firefox and Floorp. The focused browser must have the companion add-on connected. If no host is listening, install/enable the add-on and restart that browser.
