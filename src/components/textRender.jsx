export function minecraftToHTML(text) {
    const colorMap = {
        0: "var(--mc-black)",
        1: "var(--mc-dark-blue)",
        2: "var(--mc-dark-green)",
        3: "var(--mc-dark-aqua)",
        4: "var(--mc-dark-red)",
        5: "var(--mc-dark-purple)",
        6: "var(--mc-gold)",
        7: "var(--mc-gray)",
        8: "var(--mc-dark-gray)",
        9: "var(--mc-blue)",
        a: "var(--mc-green)",
        b: "var(--mc-aqua)",
        c: "var(--mc-red)",
        d: "var(--mc-light-purple)",
        e: "var(--mc-yellow)",
        f: "var(--mc-white)",
    };

    const formatMap = {
        k: "",
        l: "font-weight: bold;",
        m: "text-decoration: line-through;",
        n: "text-decoration: underline;",
        o: "font-style: italic;",
    };

    let result = "";
    let currentColor = "";
    let currentFormats = [];

    let i = 0;
    while (i < text.length) {
        if (text[i] === "§") {
            const code = text[i + 1];
            i += 2;

            if (Object.prototype.hasOwnProperty.call(colorMap, code)) {
                currentColor = `color: ${colorMap[code]};`;
            } else if (Object.prototype.hasOwnProperty.call(formatMap, code)) {
                currentFormats.push(formatMap[code]);
            } else if (code === "r") {
                currentColor = "";
                currentFormats = [];
            } else if (code === "p") {
                result += "<br>";
                currentColor = "";
                currentFormats = [];
            }
        } else {
            let content = "";
            while (i < text.length && text[i] !== "§") {
                content += text[i];
                i++;
            }
            const style = currentColor + currentFormats.join("");
            result += `<span style="${style}">${escapeHTML(content)}</span>`;
        }
    }

    return result;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function rarityToCode(rarity) {
    switch (rarity.toLowerCase()) {
        case "common":
            return "f";
        case "uncommon":
            return "a";
        case "rare":
            return "9";
        case "epic":
            return "5";
        case "legendary":
            return "6";
        case "mythic":
            return "d";
        case "divine":
            return "b";
        case "special":
            return "c";
        case "very special":
            return "c";
        case "ultimate":
            return "4";
        case "admin":
            return "4";
        default:
            return "7";
    }
}
