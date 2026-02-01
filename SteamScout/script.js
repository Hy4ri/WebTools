const CATEGORIES = {
    weapon: 'Weapon Skin',
    knife: 'Knife / Gloves',
    sticker: 'Sticker',
    music: 'Music Kit',
    graffiti: 'Graffiti',
    other: 'Other'
};

const CONDITIONS = [
    "Factory New",
    "Minimal Wear",
    "Field-Tested",
    "Well-Worn",
    "Battle-Scarred"
];

const state = {
    currentCategory: '',
    currentData: null,
    history: JSON.parse(localStorage.getItem('steamScoutHistory') || '[]'),
    isJOD: false
};

// DOM Elements
const categorySelect = document.getElementById('category-select');
const dynamicInputs = document.getElementById('dynamic-inputs');
const searchBtn = document.getElementById('search-btn');
const loader = document.getElementById('loader');
const resultsSection = document.getElementById('results');
const itemTitle = document.getElementById('item-title');
const priceLow = document.getElementById('price-low');
const priceMedian = document.getElementById('price-median');
const priceVolume = document.getElementById('price-volume');
const currencyToggle = document.getElementById('currency-toggle');
const historyChips = document.getElementById('search-history');
const alertBox = document.getElementById('alert-box');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();

    categorySelect.addEventListener('change', (e) => {
        state.currentCategory = e.target.value;
        renderInputs(state.currentCategory);
    });

    searchBtn.addEventListener('click', performSearch);

    currencyToggle.addEventListener('change', (e) => {
        state.isJOD = e.target.checked;
        updateDisplay();
    });
});

function renderInputs(category) {
    dynamicInputs.innerHTML = '';

    if (category === 'weapon' || category === 'knife') {
        dynamicInputs.innerHTML = `
            <div class="form-group">
                <label>Weapon/Knife Name</label>
                <input type="text" id="input-weapon" placeholder="e.g. AK-47 or Karambit">
            </div>
            <div class="form-group">
                <label>Skin Name</label>
                <input type="text" id="input-skin" placeholder="e.g. Redline or Doppler">
            </div>
            <div class="form-group full-width">
                <label>Condition</label>
                <select id="input-condition">
                    ${CONDITIONS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
        `;
    } else if (category === 'sticker') {
        dynamicInputs.innerHTML = `
            <div class="form-group full-width">
                <label>Sticker Name</label>
                <input type="text" id="input-name" placeholder="e.g. Gold Web (Foil)">
            </div>
        `;
    } else if (category === 'other' || category === 'music' || category === 'graffiti') {
        dynamicInputs.innerHTML = `
            <div class="form-group full-width">
                <label>Full Item Name</label>
                <input type="text" id="input-full" placeholder="e.g. Music Kit | The Verkkars, EZ4ENCE">
            </div>
        `;
    }

    // Add enter key listener to all new inputs
    dynamicInputs.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    });
}

async function performSearch() {
    const itemName = buildItemName();
    if (!itemName) return showAlert('Please fill in all fields!');

    showLoader(true);
    resultsSection.style.display = 'none';

    try {
        const encodedName = encodeURIComponent(itemName);
        // Using corsproxy.io as a reliable fallback
        const apiUrl = `https://corsproxy.io/?https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodedName}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();

        if (data.success === false || (!data.lowest_price && !data.median_price)) {
            throw new Error('Item not found, check your spelling!');
        }

        state.currentData = data;
        state.currentItemName = itemName;

        addToHistory(itemName);
        updateDisplay();
        resultsSection.style.display = 'block';

    } catch (err) {
        showAlert(err.message);
    } finally {
        showLoader(false);
    }
}

function buildItemName() {
    const cat = state.currentCategory;
    if (!cat) return null;

    if (cat === 'weapon' || cat === 'knife') {
        const weapon = document.getElementById('input-weapon').value.trim();
        const skin = document.getElementById('input-skin').value.trim();
        const condition = document.getElementById('input-condition').value;
        if (!weapon || !skin) return null;

        let name = `${weapon} | ${skin} (${condition})`;
        if (cat === 'knife') name = '★ ' + name;
        return name;
    } else if (cat === 'sticker') {
        const name = document.getElementById('input-name').value.trim();
        if (!name) return null;
        return `Sticker | ${name}`;
    } else {
        const full = document.getElementById('input-full').value.trim();
        return full || null;
    }
}

function updateDisplay() {
    if (!state.currentData) return;

    const data = state.currentData;
    itemTitle.textContent = state.currentItemName;

    const rate = state.isJOD ? 0.71 : 1;
    const symbol = state.isJOD ? 'JOD ' : '$';

    priceLow.textContent = formatPrice(data.lowest_price, rate, symbol);
    priceMedian.textContent = formatPrice(data.median_price, rate, symbol);
    priceVolume.textContent = data.volume || 'N/A';
}

function formatPrice(priceStr, rate, symbol) {
    if (!priceStr) return 'N/A';
    // Remove currency symbol and parse number
    const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) return priceStr;

    const converted = numeric * rate;
    return `${symbol}${converted.toFixed(2)}`;
}

function addToHistory(name) {
    state.history = state.history.filter(h => h !== name); // Remove duplicates
    state.history.unshift(name); // Add to start
    if (state.history.length > 5) state.history.pop(); // Keep last 5

    localStorage.setItem('steamScoutHistory', JSON.stringify(state.history));
    renderHistory();
}

function renderHistory() {
    historyChips.innerHTML = '';
    if (state.history.length === 0) {
        historyChips.innerHTML = '<p style="color: rgba(255,255,255,0.2); font-size: 0.8rem;">No recent searches</p>';
        return;
    }

    state.history.forEach(item => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = item;
        chip.onclick = () => quickSearch(item);
        historyChips.appendChild(chip);
    });
}

function quickSearch(name) {
    // Set category to 'other' and fill the full input
    categorySelect.value = 'other';
    state.currentCategory = 'other';
    renderInputs('other');
    document.getElementById('input-full').value = name;
    performSearch();
}

function showAlert(msg) {
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.textContent = msg;
    alertBox.appendChild(alert);

    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(20px)';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

function showLoader(show) {
    loader.style.display = show ? 'block' : 'none';
    searchBtn.disabled = show;
    searchBtn.style.opacity = show ? '0.5' : '1';
}
