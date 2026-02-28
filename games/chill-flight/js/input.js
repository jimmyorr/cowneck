export function initInput(state) {
    const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
        if (e.key === 'ArrowRight') keys.ArrowRight = true;
        if (e.key === 'ArrowUp') keys.ArrowUp = true;
        if (e.key === 'ArrowDown') keys.ArrowDown = true;

        if (e.key === 'l' || e.key === 'L') {
            if (state.onToggleHeadlight) state.onToggleHeadlight();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
        if (e.key === 'ArrowRight') keys.ArrowRight = false;
        if (e.key === 'ArrowUp') keys.ArrowUp = false;
        if (e.key === 'ArrowDown') keys.ArrowDown = false;
    });

    window.addEventListener('mousemove', (e) => {
        state.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        state.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            state.mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            state.mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            state.mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            state.mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
        e.preventDefault();
    }, { passive: false });

    return keys;
}
