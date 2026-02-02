interface BuilderData {
    name: string;
    totalHours: number;
    remaining: number;
    notified: boolean;
}

interface BoostData {
    endTime: number;
    notified: boolean;
}

const builderCount = 6;
const potionBoost = 10; // 10x faster
const storageKey = "builderTrackerData";
const boostKey = "activeBoost";

function getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el as T;
}

function showPopup(message: string, type: string = "popup"): void {
    const container = getElement<HTMLDivElement>("notifications");
    const div = document.createElement("div");
    div.className = type;
    div.textContent = message;
    div.onclick = () => div.remove(); // click to dismiss
    container.appendChild(div);
}

function loadBuilders(): void {
    const data: BuilderData[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const container = getElement<HTMLDivElement>("builders");
    container.innerHTML = "";
    for (let i = 0; i < builderCount; i++) {
        const b = data[i] || { name: "", totalHours: 0, remaining: 0, notified: false };
        const div = document.createElement("div");
        div.className = "builder";
        div.innerHTML = `
      <h3>Builder ${i + 1}</h3>
      <label>Project Name:</label>
      <input type="text" id="name${i}" value="${b.name}">
      <label>Total Time:</label>
      <div>
        <input type="number" id="days${i}" placeholder="Days" value="${Math.floor(b.totalHours / 24) || ""}">
        <input type="number" id="hours${i}" placeholder="Hours" value="${Math.floor(b.totalHours % 24) || ""}">
        <input type="number" id="minutes${i}" placeholder="Minutes" value="${Math.floor((b.totalHours * 60) % 60) || ""}">
      </div>
      <button id="save-${i}">Save</button>
      <div class="time-display" id="remaining${i}">
        Remaining: ${formatTime(b.remaining || 0)}<br>
        Boosted Time: ${formatTime(calcBoostedTime(b.remaining || 0))}
      </div>
    `;
        container.appendChild(div);

        // Attach event listener via TS instead of onclick HTML attribute
        const btn = div.querySelector(`#save-${i}`);
        if (btn) btn.addEventListener('click', () => saveBuilder(i));
    }
}

function saveBuilder(i: number): void {
    const nameInput = getElement<HTMLInputElement>(`name${i}`);
    const daysInput = getElement<HTMLInputElement>(`days${i}`);
    const hoursInput = getElement<HTMLInputElement>(`hours${i}`);
    const minutesInput = getElement<HTMLInputElement>(`minutes${i}`);

    const name = nameInput.value;
    const days = parseFloat(daysInput.value) || 0;
    const hours = parseFloat(hoursInput.value) || 0;
    const minutes = parseFloat(minutesInput.value) || 0;
    const totalHours = days * 24 + hours + minutes / 60;

    const data: BuilderData[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    data[i] = { name, totalHours, remaining: totalHours, notified: false };
    localStorage.setItem(storageKey, JSON.stringify(data));
    loadBuilders();
    checkBoostSufficiency();
}

function formatTime(hours: number): string {
    const totalSeconds = Math.floor(hours * 3600);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
}

function calcBoostedTime(hours: number): number {
    const boostStr = localStorage.getItem(boostKey);
    if (!boostStr) return hours;
    return hours / potionBoost;
}

function startBoost(): void {
    const hoursInput = getElement<HTMLInputElement>("boostHours");
    const minutesInput = getElement<HTMLInputElement>("boostMinutes");

    const hours = parseFloat(hoursInput.value) || 0;
    const minutes = parseFloat(minutesInput.value) || 0;
    const duration = (hours + minutes / 60) * 3600000;
    if (duration <= 0) { showPopup("Enter a valid boost duration!", "warning"); return; }
    const endTime = Date.now() + duration;

    const boostData: BoostData = { endTime, notified: false };
    localStorage.setItem(boostKey, JSON.stringify(boostData));
    updateBoostStatus();
    checkBoostSufficiency();
}

// Global expose for HTML button if we keep onclick="startBoost()"
// But better to attach listener.
const boostBtn = document.querySelector('#potions button');
if (boostBtn) boostBtn.addEventListener('click', startBoost);


function updateBoostStatus(): void {
    const boostStr = localStorage.getItem(boostKey);
    const status = getElement<HTMLDivElement>("boost-status");
    if (!boostStr) {
        status.textContent = "No active boost";
        return;
    }

    const boost: BoostData = JSON.parse(boostStr);
    const remainingMs = boost.endTime - Date.now();
    if (remainingMs <= 0) {
        localStorage.removeItem(boostKey);
        if (!boost.notified) {
            showPopup("Your boost has ended!", "popup");
        }
        status.textContent = "Boost expired";
        return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    status.textContent = `Boost Active: 10× speed for ${d}d ${h}h ${m}m ${s}s remaining`;

    applyRealTimeBoost();
    requestAnimationFrame(updateBoostStatus);
}

function applyRealTimeBoost(): void {
    const boostStr = localStorage.getItem(boostKey);
    const now = Date.now();
    const lastUpdateKey = "lastUpdateTime";
    const lastUpdate = parseFloat(localStorage.getItem(lastUpdateKey) || now.toString());
    const elapsedMs = now - lastUpdate;
    localStorage.setItem(lastUpdateKey, now.toString());

    const elapsedHours = elapsedMs / 3600000;
    const accelerated = boostStr ? elapsedHours * potionBoost : elapsedHours;

    const data: (BuilderData | null)[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let changed = false;

    for (let i = 0; i < data.length; i++) {
        if (!data[i]) continue;
        // Non-null assertion safely because we checked !data[i]
        const builder = data[i]!;
        let R = parseFloat(builder.remaining.toString()) || 0;
        if (R > 0) {
            const newR = Math.max(R - accelerated, 0);
            if (newR === 0 && !builder.notified) {
                showPopup(`${builder.name || `Builder ${i + 1}`} has finished!`, "popup");
                builder.notified = true;
            }
            builder.remaining = newR;
            changed = true;
        }
    }

    if (changed) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        // cast because we know formatting
        refreshRemainingDisplay(data as BuilderData[]);
    }
}

function refreshRemainingDisplay(data: BuilderData[]): void {
    for (let i = 0; i < data.length; i++) {
        const div = document.getElementById(`remaining${i}`);
        if (!div || !data[i]) continue;
        div.innerHTML = `
      Remaining: ${formatTime(data[i].remaining || 0)}<br>
      Boosted Time: ${formatTime(calcBoostedTime(data[i].remaining || 0))}
    `;
    }
}

function checkBoostSufficiency(): void {
    const boostStr = localStorage.getItem(boostKey);
    if (!boostStr) return;
    const boost: BoostData = JSON.parse(boostStr);

    const remainingBoostHours = (boost.endTime - Date.now()) / 3600000;
    const data: BuilderData[] = JSON.parse(localStorage.getItem(storageKey) || '[]');

    for (let i = 0; i < data.length; i++) {
        if (!data[i]) continue;
        const boostedTimeNeeded = data[i].remaining / potionBoost;
        if (boostedTimeNeeded > remainingBoostHours) {
            showPopup(`${data[i].name || `Builder ${i + 1}`} won't finish with current boost!`, "warning");
        }
    }
}

window.onload = () => {
    loadBuilders();
    updateBoostStatus();
    setInterval(applyRealTimeBoost, 1000);
};
