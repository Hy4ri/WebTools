const counters: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0
};

const multipliers: { [key: number]: number } = {
    1: 1,
    2: 2,
    3: 3
};

// Global expose since we use onclick in HTML
// Ideally we should bind listeners but that requires rewrite of HTML structure significantly or inline js calling TS.
// But standard "module" scripts don't expose to global scope implicitly.
// We should attach to window or add listeners.
// Let's attach listeners to window for backward compatibility with onclick="updateCounter(...)".
// But TypeScript might complain about extending window.
// Safer approach: Add listeners in TS.

function updateCounter(counterNumber: number, change: number) {
    const newValue = counters[counterNumber] + change;
    if (newValue >= 0) {
        counters[counterNumber] = newValue;

        const el = document.getElementById(`counter${counterNumber}`);
        if (el) el.textContent = newValue.toString();

        updateTotal();
    }
}

function updateTotal() {
    const total = Object.entries(counters).reduce((sum, [counter, value]) => {
        const c = parseInt(counter);
        return sum + (value * multipliers[c]);
    }, 0);

    const el = document.getElementById('total');
    if (el) el.textContent = `Total: ${total}`;
}

// Make it global for onclick
(window as any).updateCounter = updateCounter;
