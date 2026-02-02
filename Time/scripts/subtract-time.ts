export { };
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

    getInputElement('currentHours').value = hours.toString();
    getInputElement('currentMinutes').value = minutes.toString();
});

const subForm = document.getElementById('subtractTimeForm');
if (subForm) {
    subForm.addEventListener('submit', function (e: Event) {
        e.preventDefault();

        const currentHours = parseInt(getInputElement('currentHours').value, 10);
        const currentMinutes = parseInt(getInputElement('currentMinutes').value, 10);
        const targetHours = parseInt(getInputElement('targetHours').value, 10);
        const targetMinutes = parseInt(getInputElement('targetMinutes').value, 10);

        const totalCurrentMinutes = currentHours * 60 + currentMinutes;
        const totalTargetMinutes = targetHours * 60 + targetMinutes;

        let difference;
        if (totalTargetMinutes >= totalCurrentMinutes) {
            difference = totalTargetMinutes - totalCurrentMinutes;
        } else {
            difference = 1440 - totalCurrentMinutes + totalTargetMinutes; // Handle next day
        }

        const resultHours = Math.floor(difference / 60);
        const resultMinutes = difference % 60;

        const resultText = `${resultHours} hours and ${resultMinutes} minutes`;
        const resultEl = document.getElementById('result');
        if (resultEl) {
            resultEl.innerText = resultText;
        }
    });
}
