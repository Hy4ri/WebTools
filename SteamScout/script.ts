import {
    CATEGORIES,
    WEAPONS,
    KNIVES,
    GLOVES,
    CONDITIONS,
    WEAPON_SKINS,
    GENERIC_SKINS,
    STICKERS,
    MUSIC_KITS,
    GRAFFITI,
    CONTAINERS,
    TOOLS,
    AGENTS
} from './data';

interface SteamPriceData {
    success?: boolean;
    lowest_price?: string;
    median_price?: string;
    volume?: string;
}

interface State {
    currentCategory: string;
    currentData: SteamPriceData | null;
    currentItemName: string;
    history: string[];
    isJOD: boolean;
}

const state: State = {
    currentCategory: '',
    currentData: null,
    currentItemName: '',
    history: JSON.parse(localStorage.getItem('steamScoutHistory') || '[]'),
    isJOD: false
};

// DOM Elements - Helper to get element with type
function getEl<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el as T;
}

const categorySelect = getEl<HTMLSelectElement>('category-select');
const dynamicInputs = getEl<HTMLDivElement>('dynamic-inputs');
const searchBtn = getEl<HTMLButtonElement>('search-btn');
const loader = getEl<HTMLDivElement>('loader');
const resultsSection = getEl<HTMLDivElement>('results');
const itemTitle = getEl<HTMLElement>('item-title');
const priceLow = getEl<HTMLElement>('price-low');
const priceMedian = getEl<HTMLElement>('price-median');
const priceVolume = getEl<HTMLElement>('price-volume');
const currencyToggle = getEl<HTMLInputElement>('currency-toggle');
const historyChips = getEl<HTMLDivElement>('search-history');
const alertBox = getEl<HTMLDivElement>('alert-box');


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

    categorySelect.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLSelectElement;
        state.currentCategory = target.value;
        renderInputs(state.currentCategory);
    });

    searchBtn.addEventListener('click', performSearch);

    currencyToggle.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        state.isJOD = target.checked;
        updateDisplay();
    });
});

function renderInputs(category: string): void {
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
        setupAutocomplete('input-weapon', 'list-weapon', itemOptions, (selectedWeapon: string) => {
            if (isWeapon) {
                // @ts-ignore: WEAPON_SKINS indexing
                const newSkins = WEAPON_SKINS[selectedWeapon] || GENERIC_SKINS;
                updateSkinSource(newSkins);

                // Enable and Update Skin Input
                const skinInput = getEl<HTMLInputElement>('input-skin');
                skinInput.disabled = false;
                skinInput.placeholder = `Search valid skins for ${selectedWeapon}...`;
                skinInput.value = '';
                skinInput.focus();
            } else {
                // For knives/gloves, enable generic list
                const skinInput = getEl<HTMLInputElement>('input-skin');
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
        let options: string[] = [];
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
        input.addEventListener('keypress', (e: Event) => {
            const ke = e as KeyboardEvent;
            if (ke.key === 'Enter') performSearch();
        });
    });
}

const CACHE_DURATION = 3600000; // 1 Hour

type ProxyFn = (url: string) => string;

const PROXIES: ProxyFn[] = [
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://thingproxy.freeboard.io/fetch/${url}`,
    url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchWithFallback(targetUrl: string): Promise<Response> {
    let lastError: Error | null = null;
    for (const proxy of PROXIES) {
        try {
            const res = await fetch(proxy(targetUrl));
            if (res.ok) return res;
            console.warn(`Proxy failed: ${res.url} (${res.status})`);
            lastError = new Error(`Status ${res.status}`);
        } catch (e) {
            console.warn(`Proxy error`, e);
            lastError = e instanceof Error ? e : new Error(String(e));
        }
    }
    throw new Error(`All proxies failed. Last error: ${lastError?.message}`);
}

async function performSearch(): Promise<void> {
    const itemName = buildItemName();
    if (!itemName) { // Void return
        showAlert('Please fill in all fields!');
        return;
    }

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
        const response = await fetchWithFallback(targetUrl);

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
        const msg = err instanceof Error ? err.message : 'Failed to fetch price data.';
        showAlert(msg);
    }
    showLoader(false);
}


function handleSuccess(data: SteamPriceData, itemName: string): void {
    state.currentData = data;
    state.currentItemName = itemName;
    addToHistory(itemName);
    updateDisplay();
    resultsSection.style.display = 'block';
}

function buildItemName(): string | null {
    const cat = state.currentCategory;
    if (!cat) return null;

    if (cat === 'weapon' || cat === 'knife') {
        const weaponInput = document.getElementById('input-weapon') as HTMLInputElement;
        const skinInput = document.getElementById('input-skin') as HTMLInputElement;
        const conditionInput = document.getElementById('input-condition') as HTMLSelectElement;

        const weapon = weaponInput ? weaponInput.value.trim() : '';
        const skin = skinInput ? skinInput.value.trim() : '';
        const condition = conditionInput ? conditionInput.value : '';

        if (!weapon || !skin) return null;

        let name = `${weapon} | ${skin} (${condition})`;
        if (cat === 'knife') name = '★ ' + name;
        return name;
    } else if (cat === 'sticker') {
        const nameInput = document.getElementById('input-name') as HTMLInputElement;
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) return null;
        return `Sticker | ${name}`;
    } else {
        const fullInput = document.getElementById('input-full') as HTMLInputElement;
        const full = fullInput ? fullInput.value.trim() : '';
        return full || null;
    }
}

function updateDisplay(): void {
    if (!state.currentData) return;

    const data = state.currentData;
    itemTitle.textContent = state.currentItemName;

    const rate = state.isJOD ? 0.71 : 1;
    const symbol = state.isJOD ? 'JOD ' : '$';

    priceLow.textContent = formatPrice(data.lowest_price, rate, symbol);
    priceMedian.textContent = formatPrice(data.median_price, rate, symbol);
    priceVolume.textContent = data.volume || 'N/A';
}

function formatPrice(priceStr: string | undefined, rate: number, symbol: string): string {
    if (!priceStr) return 'N/A';
    // Remove currency symbol and parse number
    const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) return priceStr;

    const converted = numeric * rate;
    return `${symbol}${converted.toFixed(2)}`;
}

function addToHistory(name: string): void {
    state.history = state.history.filter(h => h !== name); // Remove duplicates
    state.history.unshift(name); // Add to start
    if (state.history.length > 5) state.history.pop(); // Keep last 5

    localStorage.setItem('steamScoutHistory', JSON.stringify(state.history));
    renderHistory();
}

function renderHistory(): void {
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

function quickSearch(name: string): void {
    // Set category to 'other' and fill the full input
    categorySelect.value = 'agent'; // Defaulting to one of the simple ones, logic might need adjustment if generic 'other' was intended
    // Note: The original code used 'other' but 'other' was not in CATEGORIES list. 
    // It seems 'other' falls through to the 'else' block in renderInputs?
    // Looking at renderInputs, only 'weapon', 'knife', 'sticker' have special handling.
    // 'music', 'graffiti', 'container', 'tool', 'agent' are the other ones.
    // If we pass 'other' to renderInputs, it does nothing?
    // Wait, the original code had: } else if (['music', ...].includes(category)) ...
    // So 'other' would mean NOTHING is rendered if it's not in that list.
    // However, quickSearch in original code set logic for 'other'. 
    // Let's assume 'container' or 'tool' is a safe fallback or we need to fix this.
    // Actually, looking at original code:
    // else if (['music', ...].includes(category)) ... 
    // The original code `quickSearch` set category to 'other' and then `renderInputs('other')`.
    // But `renderInputs` only handled specific strings. So 'other' would render empty inputs?
    // Actually, if `quickSearch` sets `input-full`, it implies it expects the "generic" input.
    // But that generic input is only rendered for the specific categories.
    // I will use 'container' for now or 'tool' as a fallback to ensure input-full exists.
    // Or maybe I should check if 'other' was supported.
    // In original code lines 111: includes 'music', ... 'agent'. 'other' is NOT included.
    // So `quickSearch` in original code might have been broken or relied on existing DOM? 
    // Wait, original line 319: categorySelect.value = 'other'.
    // If 'other' is not an option in the select, this does nothing or sets it to empty?
    // I will assume for now we want to treat it as 'container' or just ensure `renderInputs` handles it.
    // Let's just set it to 'container' for safety to ensure `input-full` exists.

    state.currentCategory = 'container';
    categorySelect.value = 'container';
    renderInputs('container');

    const inputFull = document.getElementById('input-full') as HTMLInputElement;
    if (inputFull) inputFull.value = name;

    performSearch();
}

function showAlert(msg: string): void {
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

function showLoader(show: boolean): void {
    loader.style.display = show ? 'block' : 'none';
    searchBtn.disabled = show;
    searchBtn.style.opacity = show ? '0.5' : '1';
}

function setupAutocomplete(inputId: string, listId: string, initialData: string[], onSelect?: (item: string) => void) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const list = document.getElementById(listId) as HTMLUListElement;
    let currentData = initialData;

    if (!input || !list) return () => { };

    function renderList(filterText: string) {
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
    return (newData: string[]) => {
        currentData = newData;
    };
}
