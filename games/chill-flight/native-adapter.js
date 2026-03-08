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
    window.STUTTER_BUFFER_MS = 150; // Fix hold-to-climb on stuttery TV remotes

    // Performance Optimizations for TV
    // Capacitor's native platform check:
    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
        console.log("Applying TV Performance Profile");

        // Lower resolution rendering (cap pixel ratio to 1) 
        // to greatly relieve the GPU on underpowered Android TVs
        if (typeof renderer !== 'undefined') {
            renderer.setPixelRatio(1.0); // Hard cap instead of window.devicePixelRatio
        }

        // Force lower view distance and mesh segments
        try {
            if (typeof RENDER_DISTANCE !== 'undefined') RENDER_DISTANCE = 1; // Short
            if (typeof SEGMENTS !== 'undefined') SEGMENTS = 20; // Low
        } catch (e) { }

        // Mobile specific: Hide the status bar
        if (Capacitor.Plugins.StatusBar) {
            Capacitor.Plugins.StatusBar.hide().catch(e => console.log('StatusBar not available', e));
        }
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
