//Fonctions de coloriage
function getRainColor(rain) {
    let color;
    if (rain > 0) color = `hsl(${Math.round(9 * rain + 180)}, 100%, 50%)`;
    else color = `hsl(0, 0%, 100%)`;
    const textColor = getTextColor(color);
    return { color, textColor };
}
function getTempColor(temp) {
    let hue;
    if (temp <= -5) hue = 300;
    else if (temp <= 10) hue = -8 * temp + 260;
    else if (temp <= 15) hue = -18 * temp + 360;
    else if (temp <= 20) hue = -4 * temp + 150;
    else if (temp <= 25) hue = -5 * temp + 170;
    else if (temp <= 30) hue = -9 * temp + 270;
    else if (temp > 30) hue = -6 * temp + 180;
    hue = (hue + 360) % 360;
    const color = `hsl(${Math.round(hue)}, 100%, 50%)`;
    const textColor = getTextColor(color);
    return { color, textColor };
}
function getUVColor(uv) {
    let hue = uv > 9 ? 300 : -26.67 * uv + 180;
    hue = (hue + 360) % 360;
    let color = `hsl(${Math.round(hue)}, 100%, 50%)`;
    if (uv < 0.5) color = `hsl(0, 0%, 100%)`;
    const textColor = getTextColor(color);
    return { color, textColor };
}
function getWindColor(wind) {
    let hue = wind > 80 ? 300 : -3.75 * wind + 250;
    hue = (hue + 360) % 360;
    const color = `hsl(${Math.round(hue)}, 100%, 50%)`;
    const textColor = getTextColor(color);
    return { color, textColor };
}
function getTextColor(color) {
    let r, g, b;
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
        const h = parseInt(hslMatch[1], 10);
        const s = parseInt(hslMatch[2], 10);
        const l = parseInt(hslMatch[3], 10);
        const hslToRgb = (h, s, l) => {
            s /= 100;
            l /= 100;
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;

                const hueToRgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                r = hueToRgb(p, q, h / 360 + 1 / 3);
                g = hueToRgb(p, q, h / 360);
                b = hueToRgb(p, q, h / 360 - 1 / 3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        };
        [r, g, b] = hslToRgb(h, s, l);
    }
    else {
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            r = parseInt(rgbMatch[1], 10);
            g = parseInt(rgbMatch[2], 10);
            b = parseInt(rgbMatch[3], 10);
        } else {
            return 'black';
        }
    }
    // Calcul de la luminosité
    const luminosity = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminosity < 105.4 ? 'white' : 'black';
}
function defaultColorFunc() {
    return {
        color: 'white',
        textColor: 'black'
    };
}