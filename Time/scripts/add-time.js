document.getElementById('addTimeForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const startHours = parseInt(document.getElementById('startHours').value, 10);
    const startMinutes = parseInt(document.getElementById('startMinutes').value, 10);
    const addHours = parseInt(document.getElementById('addHours').value, 10);
    const addMinutes = parseInt(document.getElementById('addMinutes').value, 10);

    const totalStartMinutes = startHours * 60 + startMinutes;
    const totalAddMinutes = addHours * 60 + addMinutes;
    const resultMinutes = totalStartMinutes + totalAddMinutes;

    const resultHours = Math.floor(resultMinutes / 60) % 24;
    const resultRemainingMinutes = resultMinutes % 60;
    const period = resultHours >= 12 ? 'PM' : 'AM';

    const displayHours = resultHours > 12 ? resultHours - 12 : resultHours || 12;

    const resultText = `${displayHours}:${resultRemainingMinutes.toString().padStart(2, '0')} ${period}`;
    document.getElementById('result').innerText = resultText;
});
