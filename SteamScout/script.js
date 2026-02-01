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

const WEAPONS = [
    "AK-47", "M4A4", "M4A1-S", "AWP", "Glock-18", "USP-S", "Desert Eagle",
    "Galil AR", "Famas", "SSG 08", "SG 553", "AUG", "MAC-10", "MP9",
    "MP7", "MP5-SD", "UMP-45", "P90", "PP-Bizon", "P250", "Five-SeveN",
    "Tec-9", "CZ75-Auto", "P2000", "Dual Berettas", "R8 Revolver",
    "Nova", "XM1014", "MAG-7", "Sawed-Off", "Negev", "M249", "SCAR-20", "G3SG1"
].sort();

const KNIVES = [
    "Karambit", "Butterfly Knife", "M9 Bayonet", "Bayonet", "Skeleton Knife",
    "Nomad Knife", "Paracord Knife", "Survival Knife", "Ursus Knife",
    "Navaja Knife", "Stiletto Knife", "Talon Knife", "Classic Knife",
    "Bowie Knife", "Huntsman Knife", "Falchion Knife", "Shadow Daggers",
].sort();

const GLOVES = [
    "Bloodhound Gloves", "Driver Gloves", "Hand Wraps", "Moto Gloves",
    "Specialist Gloves", "Sport Gloves", "Hydra Gloves", "Broken Fang Gloves"
].sort();

const STICKERS = [
    "Titan (Holo) | Katowice 2014", "iBUYPOWER (Holo) | Katowice 2014",
    "Howling Dawn", "Crown (Foil)", "King on the Field", "Harp of War (Holo)",
    "Winged Defuser", "Flammable (Foil)", "Swag (Foil)", "Sheriff (Foil)",
    "Reason Gaming (Holo) | Katowice 2014", "Vox Eminor (Holo) | Katowice 2014",
    "Team Dignitas (Holo) | Katowice 2014", "Natus Vincere (Holo) | Katowice 2014",
    "Team Liquid (Holo) | Atlanta 2017", "Cloud9 (Holo) | DreamHack 2014",
    "Tyloo (Holo) | Boston 2018", "Dragon Lore (Foil)", "Gold Web (Foil)"
].sort();

const MUSIC_KITS = [
    "Music Kit | The Verkkars, EZ4ENCE", "Music Kit | Scarlxrd, King, Scar",
    "Music Kit | Denzel Curry, ULTIMATE", "Music Kit | Amon Tobin, All for Dust",
    "Music Kit | AWOLNATION, I Am", "Music Kit | Beartooth, Aggressive",
    "Music Kit | Blitz Kids, The Good Youth", "Music Kit | Darude, Moments CSGO",
    "Music Kit | Neck Deep, The Lowlife", "Music Kit | Scarlxrd, CHAIN$AW.LXADXUT",
    "Music Kit | Sullivan King, Lock Me Up", "Music Kit | Tacticians, Tacticians",
    "Music Kit | High Noon", "Music Kit | Mord Fustang, Diamonds"
].sort();

const GRAFFITI = [
    "Graffiti | Clutch King (Violent Violet)", "Graffiti | EZ (Monarch Blue)",
    "Graffiti | Loser (Dust Brown)", "Graffiti | Welcome to the Clutch (War Pig Pink)",
    "Graffiti | 8-Ball (Cocoa Brown)", "Graffiti | Backstab (Monster Purple)",
    "Graffiti | Recoil (Cyan)"
].sort();

const OTHER_ITEMS = [
    "Recoil Case", "Dreams & Nightmares Case", "Revolution Case", "Fracture Case",
    "Clutch Case", "Snakebite Case", "Danger Zone Case", "Prisma 2 Case",
    "CS20 Case", "Operation Broken Fang Case", "Operation Riptide Case",
    "Kilowatt Case", "Name Tag", "Description Tag"
].sort();

// Specific mappings for popular weapons to provide "Based on weapon" experience
const WEAPON_SKINS = {
    "AK-47": ["Slate", "Redline", "Asiimov", "Vulcan", "Case Hardened", "Fire Serpent", "Wild Lotus", "Gold Arabesque", "Bloodsport", "Neon Rider", "Nightwish", "Head Shot", "Legion of Anubis", "Aquamarine Revenge", "Fuel Injector", "Jaguar", "Hydroponic", "Jet Set", "First Class", "Cartel", "Wasteland Rebel", "Frontside Misty", "Point Disarray"],
    "M4A4": ["Howl", "Asiimov", "Neo-Noir", "Desolate Space", "Hellfire", "Dragon King", "Poseidon", "Daybreak", "Royal Paladin", "The Emperor", "In Living Color", "Temukau", "Spider Lily", "Coalition", "Cyber Security", "Buzz Kill", "X-Ray", "Griffin", "Zirka"],
    "M4A1-S": ["Printstream", "Blue Phosphor", "Welcome to the Jungle", "Imminent Danger", "Knight", "Hot Rod", "Icarus Fell", "Hyper Beast", "Golden Coil", "Chantico's Fire", "Mecha Industries", "Decimator", "Nightmare", "Player Two", "Primal Saber", "Leaded Glass", "Cyrex", "Atomic Alloy", "Dark Water", "Nitro", "Guardian", "Basilisk"],
    "AWP": ["Dragon Lore", "Gungnir", "The Prince", "Desert Hydra", "Medusa", "Fade", "Lightning Strike", "Oni Taiji", "Asiimov", "Neo-Noir", "Wildfire", "Containment Breach", "Hyper Beast", "Redline", "Electric Hive", "Graphite", "Boom", "Corticoera", "Man-o'-war", "Sun in Leo", "Pink DDPAT", "Atheris", "Mortis", "Exoskeleton", "Worm God"],
    "USP-S": ["Kill Confirmed", "The Traitor", "Printstream", "Neo-Noir", "Cortex", "Monster Mashup", "Orion", "Serum", "Blueprint", "Stainless", "Guardian", "Cyrex", "Road Rash", "Overgrowth", "Dark Water"],
    "Glock-18": ["Fade", "Twilight Galaxy", "Gamma Doppler", "Vogue", "Bullet Queen", "Neo-Noir", "Snack Attack", "Water Elemental", "Wasteland Rebel", "Franklin", "Dragon Tattoo", "Royal Legion", "Grinder", "Steel Disruption", "Ironwork", "Bunsen Burner", "Reactor", "Nuclear Garden"],
    "Desert Eagle": ["Blaze", "Fennec Fox", "Printstream", "Ocean Drive", "Emerald Jörmungandr", "Sunset Storm 🤩", "Hand Cannon", "Golden Koi", "Code Red", "Kumicho Dragon", "Mecha Industries", "Conspiracy", "Cobalt Disruption", "Hypnotic", "Midnight Storm", "Crimson Web"]
};

// Fallback for everything else
const GENERIC_SKINS = [
    "Asiimov", "Redline", "Printstream", "Neo-Noir", "Hyper Beast", "Fade",
    "Doppler", "Gamma Doppler", "Tiger Tooth", "Marble Fade", "Case Hardened",
    "Crimson Web", "Slaughter", "Lore", "Autotronic", "Freehand", "Blue Steel",
    "Damascus Steel", "Stained", "Rust Coat", "Ultraviolet", "Night",
    "Forest DDPAT", "Boreal Forest", "Scorched", "Safari Mesh", "Urban Masked"
].sort();

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

    } else if (['music', 'graffiti', 'other'].includes(category)) {
        let options = [];
        let label = 'Full Item Name';
        let placeholder = 'Type to search...';

        if (category === 'music') {
            options = MUSIC_KITS;
            label = 'Music Kit';
            placeholder = 'Search Music Kits...';
        } else if (category === 'graffiti') {
            options = GRAFFITI;
            label = 'Graffiti Pattern';
            placeholder = 'Search Graffiti...';
        } else {
            options = OTHER_ITEMS;
            label = 'Item Name';
            placeholder = 'Search Items...';
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

    // Different proxies to try
    const proxies = [
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        url => `https://thingproxy.freeboard.io/fetch/${url}`,
        url => `https://cors-anywhere.herokuapp.com/${url}`
    ];

    let success = false;
    let lastError = '';

    for (const proxyFn of proxies) {
        try {
            const steamUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(itemName)}`;
            const proxiedUrl = proxyFn(steamUrl);

            const response = await fetch(proxiedUrl);
            if (!response.ok) {
                if (response.status === 403) throw new Error('Proxy blocked (403)');
                throw new Error(`Proxy error (${response.status})`);
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
            success = true;
            break;

        } catch (err) {
            console.warn(`Proxy failed:`, err);
            lastError = err.message;
            continue;
        }
    }

    if (!success) {
        showAlert(lastError || 'All proxies failed. Steam may be rate-limiting requests.');
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
