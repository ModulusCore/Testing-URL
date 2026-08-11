"use strict";

const $ = (id) => document.getElementById(id);

function addInfo(section, label, value, supported = true, raw = false) {
    const item = document.createElement("div");
    item.className = "info-item";

    const labelElement = document.createElement("span");
    labelElement.className = "label";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");
    valueElement.className = supported
        ? raw
            ? "value raw-value"
            : "value"
        : "value unsupported";

    valueElement.textContent = supported ? String(value) : "Not supported";

    item.append(labelElement, valueElement);
    $(section).appendChild(item);
}

function clearSections() {
    [
        "device",
        "browser",
        "environment",
        "display",
        "network",
        "battery",
        "graphics",
        "permissions",
        "fingerprint"
    ].forEach((id) => {
        $(id).replaceChildren();
    });
}

function getOS() {
    const platform = navigator.platform || "";
    const ua = navigator.userAgent;

    if (/Windows/i.test(ua) || /Win/i.test(platform)) {
        return "Windows";
    }

    if (/Android/i.test(ua)) {
        return "Android";
    }

    if (/iPhone|iPad|iPod/i.test(ua)) {
        return "iOS / iPadOS";
    }

    if (/Mac OS X/i.test(ua) || /Mac/i.test(platform)) {
        return "macOS";
    }

    if (/Linux/i.test(ua) || /Linux/i.test(platform)) {
        return "Linux";
    }

    return "Unknown";
}

function getBrowser() {
    const ua = navigator.userAgent;

    if (/Electron\//i.test(ua)) {
        return {
            name: "Electron",
            version: ua.match(/Electron\/([\d.]+)/i)?.[1] || "Unknown"
        };
    }

    if (/Edg\//i.test(ua)) {
        return {
            name: "Microsoft Edge",
            version: ua.match(/Edg\/([\d.]+)/i)?.[1] || "Unknown"
        };
    }

    if (/OPR\//i.test(ua)) {
        return {
            name: "Opera",
            version: ua.match(/OPR\/([\d.]+)/i)?.[1] || "Unknown"
        };
    }

    if (/Firefox\//i.test(ua)) {
        return {
            name: "Mozilla Firefox",
            version: ua.match(/Firefox\/([\d.]+)/i)?.[1] || "Unknown"
        };
    }

    if (/Chrome\//i.test(ua)) {
        return {
            name: "Google Chrome",
            version: ua.match(/Chrome\/([\d.]+)/i)?.[1] || "Unknown"
        };
    }

    if (/Safari\//i.test(ua)) {
        return {
            name: "Safari",
            version: ua.match(/Version\/([\d.]+)/i)?.[1] || "Unknown"
        };
    }

    return {
        name: "Unknown",
        version: "Unknown"
    };
}

function getDeviceType() {
    const ua = navigator.userAgent;

    if (/iPad|Tablet/i.test(ua)) {
        return "Tablet";
    }

    if (/Mobi|Android/i.test(ua)) {
        return "Mobile";
    }

    if (
        navigator.maxTouchPoints > 1 &&
        /Macintosh/i.test(ua)
    ) {
        return "Touch-capable Mac / iPadOS";
    }

    return "Desktop";
}

function getTimezone() {
    const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";

    const aliases = {
        "Asia/Calcutta": "Asia/Kolkata"
    };

    return aliases[timezone] || timezone;
}

function getWebGLInfo() {
    const canvas = document.createElement("canvas");

    const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");

    if (!gl) {
        return {
            supported: false,
            renderer: null,
            vendor: null
        };
    }

    const debugInfo =
        gl.getExtension("WEBGL_debug_renderer_info");

    let renderer = "Available";
    let vendor = "Available";

    if (debugInfo) {
        renderer =
            gl.getParameter(
                debugInfo.UNMASKED_RENDERER_WEBGL
            ) || "Unknown";

        vendor =
            gl.getParameter(
                debugInfo.UNMASKED_VENDOR_WEBGL
            ) || "Unknown";
    }

    return {
        supported: true,
        renderer,
        vendor
    };
}

function populateDevice() {
    addInfo("device", "Operating System", getOS());
    addInfo("device", "Platform", navigator.platform || "Unknown");
    addInfo("device", "Device Type", getDeviceType());

    if (navigator.hardwareConcurrency) {
        addInfo(
            "device",
            "Logical CPU Cores",
            navigator.hardwareConcurrency
        );
    } else {
        addInfo("device", "Logical CPU Cores", null, false);
    }

    if ("deviceMemory" in navigator) {
        addInfo(
            "device",
            "Approx. Device Memory",
            `${navigator.deviceMemory} GB`
        );
    } else {
        addInfo(
            "device",
            "Approx. Device Memory",
            null,
            false
        );
    }

    addInfo(
        "device",
        "Touch Points",
        navigator.maxTouchPoints ?? 0
    );
}

function populateBrowser() {
    const browser = getBrowser();

    addInfo("browser", "Browser", browser.name);
    addInfo("browser", "Browser Version", browser.version);

    addInfo(
        "browser",
        "Language",
        navigator.language || "Unknown"
    );

    addInfo(
        "browser",
        "Languages",
        navigator.languages?.join(", ") || "Unknown"
    );

    addInfo("browser", "Timezone", getTimezone());

    addInfo(
        "browser",
        "Cookies Enabled",
        navigator.cookieEnabled ? "Yes" : "No"
    );

    addInfo(
        "browser",
        "Do Not Track",
        navigator.doNotTrack || "Not specified"
    );

    addInfo(
        "browser",
        "User-Agent",
        navigator.userAgent,
        true,
        true
    );
}

function populateEnvironment() {
    const ua = navigator.userAgent;

    const isElectron = /Electron\//i.test(ua);
    const electronVersion =
        ua.match(/Electron\/([\d.]+)/i)?.[1];

    addInfo(
        "environment",
        "Execution Environment",
        isElectron ? "Electron" : "Regular Browser"
    );

    if (isElectron && electronVersion) {
        addInfo(
            "environment",
            "Electron Version",
            electronVersion
        );
    }

    addInfo(
        "environment",
        "Secure Context",
        window.isSecureContext ? "Yes" : "No"
    );

    addInfo(
        "environment",
        "Online",
        navigator.onLine ? "Yes" : "No"
    );

    addInfo(
        "environment",
        "Service Worker API",
        "serviceWorker" in navigator
            ? "Available"
            : "Unavailable",
        "serviceWorker" in navigator
    );
}

function populateDisplay() {
    addInfo(
        "display",
        "Screen Resolution",
        `${screen.width} × ${screen.height}`
    );

    addInfo(
        "display",
        "Viewport",
        `${window.innerWidth} × ${window.innerHeight}`
    );

    addInfo(
        "display",
        "Device Pixel Ratio",
        window.devicePixelRatio
    );

    addInfo(
        "display",
        "Color Depth",
        `${screen.colorDepth} bit`
    );

    addInfo(
        "display",
        "Pixel Depth",
        `${screen.pixelDepth} bit`
    );

    addInfo(
        "display",
        "Screen Orientation",
        screen.orientation?.type || "Not reported"
    );
}

function populateNetwork() {
    const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

    if (!connection) {
        addInfo(
            "network",
            "Network Information API",
            null,
            false
        );
        return;
    }

    addInfo(
        "network",
        "Information Source",
        "Browser-reported estimate"
    );

    addInfo(
        "network",
        "Connection Type",
        connection.type || "Not reported"
    );

    addInfo(
        "network",
        "Effective Type",
        connection.effectiveType || "Not reported"
    );

    addInfo(
        "network",
        "Downlink Estimate",
        connection.downlink != null
            ? `${connection.downlink} Mbps`
            : "Not reported"
    );

    addInfo(
        "network",
        "RTT Estimate",
        connection.rtt != null
            ? `${connection.rtt} ms`
            : "Not reported"
    );

    addInfo(
        "network",
        "Save Data",
        connection.saveData ? "Yes" : "No"
    );
}

async function populateBattery() {
    if (!("getBattery" in navigator)) {
        addInfo("battery", "Battery API", null, false);
        addInfo("battery", "Battery Level", null, false);
        addInfo("battery", "Charging", null, false);
        return;
    }

    try {
        const battery = await navigator.getBattery();

        addInfo("battery", "Battery API", "Available");
        addInfo(
            "battery",
            "Battery Level",
            `${Math.round(battery.level * 100)}%`
        );
        addInfo(
            "battery",
            "Charging",
            battery.charging ? "Yes" : "No"
        );

        addInfo(
            "battery",
            "Charging Time",
            battery.chargingTime === Infinity
                ? "Not reported"
                : `${battery.chargingTime} seconds`
        );

        addInfo(
            "battery",
            "Discharging Time",
            battery.dischargingTime === Infinity
                ? "Not reported"
                : `${battery.dischargingTime} seconds`
        );
    } catch {
        addInfo(
            "battery",
            "Battery API",
            null,
            false
        );
    }
}

function populateGraphics() {
    const webgl = getWebGLInfo();

    addInfo(
        "graphics",
        "WebGL",
        webgl.supported ? "Supported" : "Not supported",
        webgl.supported
    );

    if (!webgl.supported) {
        addInfo("graphics", "GPU Renderer", null, false);
        addInfo("graphics", "GPU Vendor", null, false);
        return;
    }

    addInfo(
        "graphics",
        "GPU Renderer",
        webgl.renderer
    );

    addInfo(
        "graphics",
        "GPU Vendor",
        webgl.vendor
    );
}

async function getPermissionState(name) {
    if (!navigator.permissions?.query) {
        return {
            value: "Permissions API unavailable",
            supported: false
        };
    }

    try {
        const result = await navigator.permissions.query({
            name
        });

        return {
            value: result.state,
            supported: true
        };
    } catch {
        return {
            value: "Not queryable",
            supported: false
        };
    }
}

async function populatePermissions() {
    const permissions = [
        ["Geolocation", "geolocation"],
        ["Camera", "camera"],
        ["Microphone", "microphone"],
        ["Notifications", "notifications"],
        ["Clipboard Read", "clipboard-read"],
        ["Clipboard Write", "clipboard-write"]
    ];

    for (const [label, permission] of permissions) {
        const result = await getPermissionState(permission);

        addInfo(
            "permissions",
            label,
            result.value,
            result.supported
        );
    }
}

function populateFingerprintSignals() {
    addInfo(
        "fingerprint",
        "User-Agent",
        navigator.userAgent,
        true,
        true
    );

    addInfo(
        "fingerprint",
        "Platform",
        navigator.platform || "Unknown"
    );

    addInfo(
        "fingerprint",
        "CPU Cores",
        navigator.hardwareConcurrency || "Not reported"
    );

    addInfo(
        "fingerprint",
        "Device Memory",
        "deviceMemory" in navigator
            ? `${navigator.deviceMemory} GB`
            : "Not reported"
    );

    addInfo(
        "fingerprint",
        "Screen",
        `${screen.width} × ${screen.height}`
    );

    addInfo(
        "fingerprint",
        "Pixel Ratio",
        window.devicePixelRatio
    );

    addInfo(
        "fingerprint",
        "Color Depth",
        `${screen.colorDepth} bit`
    );

    addInfo(
        "fingerprint",
        "Timezone",
        getTimezone()
    );

    addInfo(
        "fingerprint",
        "Language",
        navigator.language || "Unknown"
    );
}

async function scan() {
    clearSections();

    $("status").textContent =
        "Collecting information locally...";

    populateDevice();
    populateBrowser();
    populateEnvironment();
    populateDisplay();
    populateNetwork();
    populateGraphics();
    populateFingerprintSignals();

    await Promise.all([
        populateBattery(),
        populatePermissions()
    ]);

    $("status").textContent =
        `Scan completed locally • ${new Date().toLocaleTimeString()}`;
}

$("rescan").addEventListener("click", scan);

scan();