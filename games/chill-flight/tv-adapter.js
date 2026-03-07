// tv-adapter.js
// "The Sidecar Rule": Enhances the core game for TV without touching core files.
(function () {
    console.log("TV Adapter initialized");

    // Check if we are running in an Android TV / Cordova / Capacitor context
    // This is optional since we could just apply it blindly to the Capacitor build
    // but detecting specific things like the back button is useful.

    // TV Overrides
    if (typeof window.STEER_HOLD_THRESHOLD !== 'undefined') {
        window.STEER_HOLD_THRESHOLD = 100; // Lower threshold to feel more responsive on Bluetooth remotes
    }

    // Key mapping for D-pad (Center -> Enter, Back -> Backspace)
    window.addEventListener('keydown', function (e) {
        // D-pad center is usually keycode 23 or 66 (Enter) on Android TV
        if (e.keyCode === 23) {
            e.preventDefault();
            const enterClick = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            e.target.dispatchEvent(enterClick);
        }

        // D-pad Back is usually 4, 27 (Esc), or the native Capacitor back button
        if (e.keyCode === 4 || e.key === 'GoBack') {
            e.preventDefault();
            const backspaceClick = new KeyboardEvent('keydown', {
                key: 'Backspace',
                code: 'Backspace',
                keyCode: 8,
                which: 8,
                bubbles: true
            });
            document.dispatchEvent(backspaceClick);
        }
    }, true); // Use capture phase occasionally helps intercept before local logic, but games often use global listener anyway.

    // Handle Capacitor's native hardware back button if available
    document.addEventListener("deviceready", function () {
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.App) {
            Capacitor.Plugins.App.addListener('backButton', () => {
                const backEvent = new KeyboardEvent('keydown', {
                    key: 'Backspace',
                    code: 'Backspace',
                    keyCode: 8,
                    which: 8,
                    bubbles: true
                });
                document.dispatchEvent(backEvent);
            });
        }
    }, false);
})();
