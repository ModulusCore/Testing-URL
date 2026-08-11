"use strict";

/*
 * Testing-URL
 * Client-side browser/device diagnostics.
 *
 * Secrets such as BOT_TOKEN, TELEGRAM_CHAT_ID and SITE_PASSWORD
 * must never be placed in this file.
 */

const $ = (id) => document.getElementById(id);

const loginScreen = $("login-screen");
const app = $("app");
const loginForm = $("login-form");
const passwordInput = $("password");
const loginError = $("login-error");

function addInfo(section, label, value, supported = true, raw = false) {
    const container = $(section);

    if (!container) {
        return;
    }

    const item = document.createElement("div");
    item.className = "info-item";

    const labelElement = document.createElement("span");
    labelElement.className = "label";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");

    if (!supported) {
        valueElement.className = "value unsupported";
        valueElement.textContent = "Not supported";
    } else {
        valueElement.className = raw
            ? "value raw-value"
            : "value";

        valueElement.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "Not reported"
                : String(value);
    }

    item.append(labelElement, valueElement);
    container.appendChild(item);
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
        const element = $(id);

        if (element) {
            element.replaceChildren();
        }
    });
}

/* =========================
   DEVICE
========================= */

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

function populateDevice() {
    addInfo("device", "Operating System", getOS());

    addInfo(
        "device",
        "Platform",
        navigator.platform || "Unknown"
    );

    addInfo(
        "device",
        "Device Type",
        getDeviceType()
    );

    if (navigator.hardwareConcurrency) {
        addInfo(
            "device",
            "Logical CPU Cores",
            navigator.hardwareConcurrency
        );
    } else {
        addInfo(
            "device",
            "Logical CPU Cores",
            null,
            false
        );
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

/* =========================
   BROWSER
========================= */

function getBrowser() {
    const ua = navigator.userAgent;

    if (/Electron\//i.test(ua)) {
        return {
            name: "Electron",
            version:
                ua.match(/Electron\/([\d.]+)/i)?.[1] ||
                "Unknown"
        };
    }

    if (/Edg\//i.test(ua)) {
        return {
            name: "Microsoft Edge",
            version:
                ua.match(/Edg\/([\d.]+)/i)?.[1] ||
                "Unknown"
        };
    }

    if (/OPR\//i.test(ua)) {
        return {
            name: "Opera",
            version:
                ua.match(/OPR\/([\d.]+)/i)?.[1] ||
                "Unknown"
        };
    }

    if (/Firefox\//i.test(ua)) {
        return {
            name: "Mozilla Firefox",
            version:
                ua.match(/Firefox\/([\d.]+)/i)?.[1] ||
                "Unknown"
        };
    }

    if (/Chrome\//i.test(ua)) {
        return {
            name: "Google Chrome",
            version:
                ua.match(/Chrome\/([\d.]+)/i)?.[1] ||
                "Unknown"
        };
    }

    if (/Safari\//i.test(ua)) {
        return {
            name: "Safari",
            version:
                ua.match(/Version\/([\d.]+)/i)?.[1] ||
                "Unknown"
        };
    }

    return {
        name: "Unknown",
        version: "Unknown"
    };
}

function getTimezone() {
    const timezone =
        Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone || "Unknown";

    const aliases = {
        "Asia/Calcutta": "Asia/Kolkata"
    };

    return aliases[timezone] || timezone;
}

function populateBrowser() {
    const browser = getBrowser();

    addInfo(
        "browser",
        "Browser",
        browser.name
    );

    addInfo(
        "browser",
        "Browser Version",
        browser.version
    );

    addInfo(
        "browser",
        "Language",
        navigator.language || "Unknown"
    );

    addInfo(
        "browser",
        "Languages",
        navigator.languages?.join(", ") ||
            "Unknown"
    );

    addInfo(
        "browser",
        "Timezone",
        getTimezone()
    );

    addInfo(
        "browser",
        "Cookies Enabled",
        navigator.cookieEnabled
            ? "Yes"
            : "No"
    );

    addInfo(
        "browser",
        "Do Not Track",
        navigator.doNotTrack ||
            "Not specified"
    );

    addInfo(
        "browser",
        "User-Agent",
        navigator.userAgent,
        true,
        true
    );
}

/* =========================
   ENVIRONMENT
========================= */

function populateEnvironment() {
    const ua = navigator.userAgent;

    const isElectron =
        /Electron\//i.test(ua);

    const electronVersion =
        ua.match(/Electron\/([\d.]+)/i)?.[1];

    addInfo(
        "environment",
        "Execution Environment",
        isElectron
            ? "Electron"
            : "Regular Browser"
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
        window.isSecureContext
            ? "Yes"
            : "No"
    );

    addInfo(
        "environment",
        "Online",
        navigator.onLine
            ? "Yes"
            : "No"
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

/* =========================
   DISPLAY
========================= */

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
        screen.orientation?.type ||
            "Not reported"
    );
}

/* =========================
   NETWORK
========================= */

async function populateNetwork() {
    const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

    if (connection) {
        addInfo(
            "network",
            "Information Source",
            "Browser-reported estimate"
        );

        addInfo(
            "network",
            "Connection Type",
            connection.type ||
                "Not reported"
        );

        addInfo(
            "network",
            "Effective Type",
            connection.effectiveType ||
                "Not reported"
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
            connection.saveData
                ? "Yes"
                : "No"
        );
    } else {
        addInfo(
            "network",
            "Network Information API",
            null,
            false
        );
    }

    try {
        const response = await fetch(
            "/api/ip",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "IP request failed"
            );
        }

        const data =
            await response.json();

        if (data.local) {
            addInfo(
                "network",
                "Public IP",
                "Not available in local mode"
            );

            addInfo(
                "network",
                "IP Detection",
                "Localhost connection"
            );
        } else {
            addInfo(
                "network",
                "Public IP",
                data.ip ||
                    "Unavailable"
            );

            addInfo(
                "network",
                "IP Detection",
                "Detected by this server"
            );
        }
    } catch {
        addInfo(
            "network",
            "Public IP",
            "Unavailable"
        );

        addInfo(
            "network",
            "IP Detection",
            "Server request failed"
        );
    }
}

/* =========================
   BATTERY
========================= */

async function populateBattery() {
    if (!("getBattery" in navigator)) {
        addInfo(
            "battery",
            "Battery API",
            null,
            false
        );

        addInfo(
            "battery",
            "Battery Level",
            null,
            false
        );

        addInfo(
            "battery",
            "Charging",
            null,
            false
        );

        return;
    }

    try {
        const battery =
            await navigator.getBattery();

        addInfo(
            "battery",
            "Battery API",
            "Available"
        );

        addInfo(
            "battery",
            "Battery Level",
            `${Math.round(
                battery.level * 100
            )}%`
        );

        addInfo(
            "battery",
            "Charging",
            battery.charging
                ? "Yes"
                : "No"
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

/* =========================
   GRAPHICS
========================= */

function getWebGLInfo() {
    const canvas =
        document.createElement("canvas");

    const gl =
        canvas.getContext("webgl") ||
        canvas.getContext(
            "experimental-webgl"
        );

    if (!gl) {
        return {
            supported: false,
            renderer: null,
            vendor: null
        };
    }

    const debugInfo =
        gl.getExtension(
            "WEBGL_debug_renderer_info"
        );

    let renderer = "Available";
    let vendor = "Available";

    if (debugInfo) {
        renderer =
            gl.getParameter(
                debugInfo.UNMASKED_RENDERER_WEBGL
            ) ||
            "Unknown";

        vendor =
            gl.getParameter(
                debugInfo.UNMASKED_VENDOR_WEBGL
            ) ||
            "Unknown";
    }

    return {
        supported: true,
        renderer,
        vendor
    };
}

function populateGraphics() {
    const webgl =
        getWebGLInfo();

    addInfo(
        "graphics",
        "WebGL",
        webgl.supported
            ? "Supported"
            : "Not supported",
        webgl.supported
    );

    if (!webgl.supported) {
        addInfo(
            "graphics",
            "GPU Renderer",
            null,
            false
        );

        addInfo(
            "graphics",
            "GPU Vendor",
            null,
            false
        );

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

/* =========================
   PERMISSIONS
========================= */

async function getPermissionState(name) {
    if (!navigator.permissions?.query) {
        return {
            value:
                "Permissions API unavailable",
            supported: false
        };
    }

    try {
        const result =
            await navigator.permissions.query({
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

    for (
        const [label, permission]
        of permissions
    ) {
        const result =
            await getPermissionState(
                permission
            );

        addInfo(
            "permissions",
            label,
            result.value,
            result.supported
        );
    }
}

/* =========================
   FINGERPRINT SIGNALS
========================= */

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
        navigator.platform ||
            "Unknown"
    );

    addInfo(
        "fingerprint",
        "CPU Cores",
        navigator.hardwareConcurrency ||
            "Not reported"
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
        navigator.language ||
            "Unknown"
    );
}

/* =========================
   REPORT COLLECTION
========================= */

function getInfoValue(
    section,
    label
) {
    const container =
        $(section);

    if (!container) {
        return null;
    }

    const items =
        container.querySelectorAll(
            ".info-item"
        );

    for (const item of items) {
        const labelElement =
            item.querySelector(
                ".label"
            );

        const valueElement =
            item.querySelector(
                ".value"
            );

        if (
            labelElement &&
            labelElement.textContent === label
        ) {
            return (
                valueElement?.textContent ||
                null
            );
        }
    }

    return null;
}

function collectReportData() {
    return {
        device: {
            os: getInfoValue(
                "device",
                "Operating System"
            ),

            platform: getInfoValue(
                "device",
                "Platform"
            ),

            type: getInfoValue(
                "device",
                "Device Type"
            ),

            cpuCores: getInfoValue(
                "device",
                "Logical CPU Cores"
            ),

            memory: getInfoValue(
                "device",
                "Approx. Device Memory"
            )
        },

        browser: {
            name: getInfoValue(
                "browser",
                "Browser"
            ),

            version: getInfoValue(
                "browser",
                "Browser Version"
            ),

            language: getInfoValue(
                "browser",
                "Language"
            ),

            timezone: getInfoValue(
                "browser",
                "Timezone"
            )
        },

        display: {
            resolution: getInfoValue(
                "display",
                "Screen Resolution"
            ),

            viewport: getInfoValue(
                "display",
                "Viewport"
            ),

            pixelRatio: getInfoValue(
                "display",
                "Device Pixel Ratio"
            ),

            colorDepth: getInfoValue(
                "display",
                "Color Depth"
            )
        },

        network: {
            effectiveType: getInfoValue(
                "network",
                "Effective Type"
            ),

            downlink: getInfoValue(
                "network",
                "Downlink Estimate"
            ),

            rtt: getInfoValue(
                "network",
                "RTT Estimate"
            )
        },

        battery: {
            level: getInfoValue(
                "battery",
                "Battery Level"
            ),

            charging: getInfoValue(
                "battery",
                "Charging"
            )
        },

        graphics: {
            renderer: getInfoValue(
                "graphics",
                "GPU Renderer"
            )
        },

        permissions: {
            geolocation: getInfoValue(
                "permissions",
                "Geolocation"
            ),

            camera: getInfoValue(
                "permissions",
                "Camera"
            ),

            microphone: getInfoValue(
                "permissions",
                "Microphone"
            ),

            notifications: getInfoValue(
                "permissions",
                "Notifications"
            )
        }
    };
}

/* =========================
   TELEGRAM REPORT
========================= */

async function sendReportToServer() {
    const report =
        collectReportData();

    try {
        const response =
            await fetch(
                "/api/report",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    cache: "no-store",

                    body:
                        JSON.stringify(report)
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                "Report failed"
            );
        }

        return true;
    } catch (error) {
        console.error(
            "Unable to send diagnostic report:",
            error
        );

        return false;
    }
}

/* =========================
   SCAN
========================= */

async function scan() {
    clearSections();

    $("status").textContent =
        "Collecting information locally...";

    populateDevice();
    populateBrowser();
    populateEnvironment();
    populateDisplay();

    await populateNetwork();

    populateGraphics();
    populateFingerprintSignals();

    await Promise.all([
        populateBattery(),
        populatePermissions()
    ]);

    $("status").textContent =
        "Sending diagnostic report...";

    const reportSent =
        await sendReportToServer();

    if (reportSent) {
        $("status").textContent =
            `Scan completed locally • Report sent • ${new Date().toLocaleTimeString()}`;
    } else {
        $("status").textContent =
            `Scan completed locally • Report could not be sent • ${new Date().toLocaleTimeString()}`;
    }
}

/* =========================
   AUTHENTICATION
========================= */

function showLogin() {
    loginScreen.hidden = false;
    app.hidden = true;

    passwordInput.focus();
}

function showApp() {
    loginScreen.hidden = true;
    app.hidden = false;

    scan();
}

async function checkAuthentication() {
    try {
        const response =
            await fetch(
                "/api/auth",
                {
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (data.authenticated) {
            showApp();
        } else {
            showLogin();
        }
    } catch {
        showLogin();
    }
}

loginForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        loginError.textContent = "";

        const password =
            passwordInput.value;

        try {
            const response =
                await fetch(
                    "/api/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        cache: "no-store",

                        body:
                            JSON.stringify({
                                password
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                loginError.textContent =
                    "Incorrect password.";

                passwordInput.select();

                return;
            }

            passwordInput.value = "";

            showApp();
        } catch {
            loginError.textContent =
                "Unable to connect to the server.";
        }
    }
);

/* =========================
   START
========================= */

checkAuthentication();