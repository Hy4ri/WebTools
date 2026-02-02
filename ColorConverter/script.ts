// Utility functions for getting elements
function getInput(id: string): HTMLInputElement {
    const el = document.getElementById(id);
    if (!el || !(el instanceof HTMLInputElement)) {
        throw new Error(`Element #${id} not found or not an input`);
    }
    return el;
}

function getEl(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Element #${id} not found`);
    return el;
}

// Elements
const colorDisplay = getEl('color-display');
const nativePicker = getInput('native-picker');

const hexInput = getInput('hex-input');

const rgbR = getInput('rgb-r');
const rgbG = getInput('rgb-g');
const rgbB = getInput('rgb-b');

const hslH = getInput('hsl-h');
const hslS = getInput('hsl-s');
const hslL = getInput('hsl-l');

// Validation & Clamping
function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

// Helper to update display background
function updateDisplay(hex: string) {
    colorDisplay.style.backgroundColor = hex;
    nativePicker.value = hex;
}

// Check if we are currently updating to prevent recursion loops
let isUpdating = false;

// Conversion Logic

/**
 * HEX to RGB
 */
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * RGB to Hex
 */
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Update Functions

function updateFromHex() {
    if (isUpdating) return;
    isUpdating = true;

    let hex = hexInput.value;
    if (!hex.startsWith('#')) {
        hex = '#' + hex;
    }

    const rgb = hexToRgb(hex);
    if (rgb) {
        // Valid Hex
        hexInput.style.borderColor = '#444';

        // Update RGB
        rgbR.value = rgb.r.toString();
        rgbG.value = rgb.g.toString();
        rgbB.value = rgb.b.toString();

        // Update HSL
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hslH.value = hsl.h.toString();
        hslS.value = hsl.s.toString();
        hslL.value = hsl.l.toString();

        updateDisplay(hex);
    } else {
        // Invalid Hex
        // Don't update others, maybe show error
        // hexInput.style.borderColor = 'red';
    }

    isUpdating = false;
}

function updateFromRgb() {
    if (isUpdating) return;
    isUpdating = true;

    const r = clamp(parseInt(rgbR.value) || 0, 0, 255);
    const g = clamp(parseInt(rgbG.value) || 0, 0, 255);
    const b = clamp(parseInt(rgbB.value) || 0, 0, 255);

    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);

    hexInput.value = hex;

    hslH.value = hsl.h.toString();
    hslS.value = hsl.s.toString();
    hslL.value = hsl.l.toString();

    updateDisplay(hex);

    isUpdating = false;
}

function updateFromHsl() {
    if (isUpdating) return;
    isUpdating = true;

    const h = clamp(parseInt(hslH.value) || 0, 0, 360);
    const s = clamp(parseInt(hslS.value) || 0, 0, 100);
    const l = clamp(parseInt(hslL.value) || 0, 0, 100);

    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    rgbR.value = rgb.r.toString();
    rgbG.value = rgb.g.toString();
    rgbB.value = rgb.b.toString();

    hexInput.value = hex;

    updateDisplay(hex);

    isUpdating = false;
}

function updateFromPicker() {
    if (isUpdating) return;
    isUpdating = true;

    const hex = nativePicker.value;
    hexInput.value = hex;

    // Manually trigger the hex logic
    isUpdating = false; // Reset so hex update can run
    updateFromHex();
}


// Event Listeners
hexInput.addEventListener('input', updateFromHex);

rgbR.addEventListener('input', updateFromRgb);
rgbG.addEventListener('input', updateFromRgb);
rgbB.addEventListener('input', updateFromRgb);

hslH.addEventListener('input', updateFromHsl);
hslS.addEventListener('input', updateFromHsl);
hslL.addEventListener('input', updateFromHsl);

nativePicker.addEventListener('input', updateFromPicker);

// Initialize with White
hexInput.value = '#FFFFFF';
updateFromHex();
