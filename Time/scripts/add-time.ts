function getInputElement(id: string): HTMLInputElement {
    const el = document.getElementById(id);
    if (!el || !(el instanceof HTMLInputElement)) {
        throw new Error(`Element #${id} not found or not an input`);
    }
    return el;
}

document.addEventListener('DOMContentLoaded', function () {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    getInputElement('startHours').value = hours.toString();
    getInputElement('startMinutes').value = minutes.toString();
});

const form = document.getElementById('addTimeForm');
if (form) {
    form.addEventListener('submit', function (e: Event) {
        e.preventDefault();

        const startHours = parseInt(getInputElement('startHours').value, 10);
        const startMinutes = parseInt(getInputElement('startMinutes').value, 10);
        const addHours = parseInt(getInputElement('addHours').value, 10);
        const addMinutes = parseInt(getInputElement('addMinutes').value, 10);

        const totalStartMinutes = startHours * 60 + startMinutes;
        const totalAddMinutes = addHours * 60 + addMinutes;
        const resultMinutes = totalStartMinutes + totalAddMinutes;

        const resultHours = Math.floor(resultMinutes / 60) % 24;
        const resultRemainingMinutes = resultMinutes % 60;
        const period = resultHours >= 12 ? 'PM' : 'AM';

        const displayHours = resultHours > 12 ? resultHours - 12 : resultHours || 12;

        const resultText = `${displayHours}:${resultRemainingMinutes.toString().padStart(2, '0')} ${period}`;
        const resultEl = document.getElementById('result');
        if (resultEl) {
            resultEl.innerText = resultText;
        }
    });
}
