const NATIVE_HOST = 'org.easystroke.wayland';
const SUPPORTED_ACTIONS = new Set([
    'new-tab', 'back', 'forward', 'reload', 'close-tab', 'new-window',
]);

let nativePort = null;
let reconnectTimer = null;

function connectNativeHost() {
    if (nativePort)
        return;
    try {
        nativePort = browser.runtime.connectNative(NATIVE_HOST);
        nativePort.onMessage.addListener(message => {
            if (message && SUPPORTED_ACTIONS.has(message.action))
                runAction(message.action).catch(error => console.error('EasyStroke browser action failed:', error));
        });
        nativePort.onDisconnect.addListener(() => {
            nativePort = null;
            if (reconnectTimer)
                clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connectNativeHost, 1500);
        });
    } catch (error) {
        nativePort = null;
        console.error('EasyStroke native messaging connection failed:', error);
        reconnectTimer = setTimeout(connectNativeHost, 3000);
    }
}

async function runAction(action) {
    const tabs = await browser.tabs.query({active: true, lastFocusedWindow: true});
    const tab = tabs[0];
    switch (action) {
    case 'new-tab':
        await browser.tabs.create({active: true});
        break;
    case 'back':
        if (tab)
            await browser.tabs.goBack(tab.id);
        break;
    case 'forward':
        if (tab)
            await browser.tabs.goForward(tab.id);
        break;
    case 'reload':
        if (tab)
            await browser.tabs.reload(tab.id);
        break;
    case 'close-tab':
        if (tab)
            await browser.tabs.remove(tab.id);
        break;
    case 'new-window':
        await browser.windows.create({url: 'about:blank'});
        break;
    }
}

connectNativeHost();
