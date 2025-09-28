document.getElementById('subtractTimeForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const currentHours = parseInt(document.getElementById('currentHours').value, 10);
    const currentMinutes = parseInt(document.getElementById('currentMinutes').value, 10);
    const targetHours = parseInt(document.getElementById('targetHours').value, 10);
    const targetMinutes = parseInt(document.getElementById('targetMinutes').value, 10);

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
    document.getElementById('result').innerText = resultText;
});
