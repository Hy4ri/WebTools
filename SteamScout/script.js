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
    // Populate Categories dynamically
    categorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
    for (const [key, label] of Object.entries(CATEGORIES)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = label;
        categorySelect.appendChild(option);
    }

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
        const isWeapon = category === 'weapon';
        const itemOptions = isWeapon ? WEAPONS : [...KNIVES, ...GLOVES];
        const label = isWeapon ? 'Select Weapon' : 'Select Knife/Gloves';

        const html = `
            <div class="form-group autocomplete-wrapper">
                <label>${label}</label>
                <input type="text" id="input-weapon" placeholder="Type to search..." autocomplete="off">
                <ul id="list-weapon" class="autocomplete-list"></ul>
            </div>
            <div class="form-group autocomplete-wrapper">
                <label>Skin Name</label>
                <input type="text" id="input-skin" placeholder="First select a weapon..." autocomplete="off" disabled>
                <ul id="list-skin" class="autocomplete-list"></ul>
            </div>
            <div class="form-group full-width">
                <label>Condition</label>
                <select id="input-condition">
                    ${CONDITIONS.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
        `;
        dynamicInputs.innerHTML = html;

        // Initialize Skin Autocomplete first to get the updater function
        const updateSkinSource = setupAutocomplete('input-skin', 'list-skin', GENERIC_SKINS);

        // Initialize Weapon Autocomplete with Selection Listener
        setupAutocomplete('input-weapon', 'list-weapon', itemOptions, (selectedWeapon) => {
            if (isWeapon) {
                const newSkins = WEAPON_SKINS[selectedWeapon] || GENERIC_SKINS;
                updateSkinSource(newSkins);

                // Enable and Update Skin Input
                const skinInput = document.getElementById('input-skin');
                skinInput.disabled = false;
                skinInput.placeholder = `Search valid skins for ${selectedWeapon}...`;
                skinInput.value = '';
                skinInput.focus();
            } else {
                // For knives/gloves, enable generic list
                const skinInput = document.getElementById('input-skin');
                skinInput.disabled = false;
                skinInput.placeholder = "Type skin name...";
            }
        });

    } else if (category === 'sticker') {
        dynamicInputs.innerHTML = `
            <div class="form-group autocomplete-wrapper full-width">
                <label>Sticker Name</label>
                <input type="text" id="input-name" placeholder="Type to search sticker..." autocomplete="off">
                <ul id="list-sticker" class="autocomplete-list"></ul>
                <small style="color: #666; font-size: 0.8rem; margin-top: 0.5rem; display: block;">* Type 'Katowice' or 'Holo' to filter</small>
            </div>
        `;
        setupAutocomplete('input-name', 'list-sticker', STICKERS);

    } else if (['music', 'graffiti', 'container', 'tool', 'agent'].includes(category)) {
        let options = [];
        let label = 'Full Item Name';
        let placeholder = 'Type to search...';

        switch (category) {
            case 'music':
                options = MUSIC_KITS;
                label = 'Music Kit';
                placeholder = 'Search Music Kits...';
                break;
            case 'graffiti':
                options = GRAFFITI;
                label = 'Graffiti Pattern';
                placeholder = 'Search Graffiti...';
                break;
            case 'container':
                options = CONTAINERS;
                label = 'Case / Capsule Name';
                placeholder = 'Search Cases...';
                break;
            case 'tool':
                options = TOOLS;
                label = 'Tool / Tag Name';
                placeholder = 'Search Tools...';
                break;
            case 'agent':
                options = AGENTS;
                label = 'Agent Name';
                placeholder = 'Search Agents...';
                break;
        }

        dynamicInputs.innerHTML = `
            <div class="form-group autocomplete-wrapper full-width">
                <label>${label}</label>
                <input type="text" id="input-full" placeholder="${placeholder}" autocomplete="off">
                <ul id="list-full" class="autocomplete-list"></ul>
            </div>
        `;
        setupAutocomplete('input-full', 'list-full', options);
    }

    // Add enter key listener to all inputs
    dynamicInputs.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    });
}

const CACHE_DURATION = 3600000; // 1 Hour

async function performSearch() {
    const itemName = buildItemName();
    if (!itemName) return showAlert('Please fill in all fields!');

    showLoader(true);
    resultsSection.style.display = 'none';

    // Check Cache
    const cacheKey = `price_${encodeURIComponent(itemName)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const entry = JSON.parse(cached);
            if (Date.now() - entry.timestamp < CACHE_DURATION) {
                console.log('Using cached price data');
                handleSuccess(entry.data, itemName);
                showLoader(false);
                return;
            }
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }

    try {
        const targetUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(itemName)}`;
        const steamUrl = `https://corsproxy.io/?` + encodeURIComponent(targetUrl);

        const response = await fetch(steamUrl);
        if (!response.ok) {
            throw new Error(`Steam API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success === false || (!data.lowest_price && !data.median_price)) {
            throw new Error('Item not found on Steam!');
        }

        // Save to Cache
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: data
        }));

        handleSuccess(data, itemName);

    } catch (err) {
        console.warn(`Fetch failed:`, err);
        showAlert(err.message || 'Failed to fetch price data.');
    }
    showLoader(false);
}


function handleSuccess(data, itemName) {
    state.currentData = data;
    state.currentItemName = itemName;
    addToHistory(itemName);
    updateDisplay();
    resultsSection.style.display = 'block';
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

function setupAutocomplete(inputId, listId, initialData, onSelect) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    let currentData = initialData;

    function renderList(filterText) {
        list.innerHTML = '';
        const lowerFilter = filterText.toLowerCase();
        // Limit to 50 results to prevent lag
        const matches = currentData.filter(item => item.toLowerCase().includes(lowerFilter)).slice(0, 50);

        if (matches.length === 0) {
            list.classList.remove('visible');
            return;
        }

        matches.forEach(item => {
            const li = document.createElement('li');
            li.className = 'autocomplete-item';
            li.textContent = item;
            li.onclick = () => {
                input.value = item;
                list.classList.remove('visible');
                if (onSelect) onSelect(item);
            };
            list.appendChild(li);
        });
        list.classList.add('visible');
    }

    input.addEventListener('input', () => renderList(input.value));
    input.addEventListener('focus', () => renderList(input.value));

    // Delay hiding to allow click event to register
    input.addEventListener('blur', () => {
        setTimeout(() => list.classList.remove('visible'), 200);
    });

    // Allow updating data source dynamically
    return (newData) => {
        currentData = newData;
    };
}
