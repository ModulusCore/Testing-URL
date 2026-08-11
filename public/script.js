"use strict";

/*
 * Testing-URL
 *
 * Browser-side diagnostic collection.
 *
 * Telegram credentials NEVER belong in this file.
 * They remain on the server in .env.
 *
 * Photo/report transmission happens only after
 * the user explicitly clicks "Capture & Send".
 */


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function safe(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "Not reported";
    }

    return String(value);
}

function clear(id) {
    const element = $(id);

    if (element) {
        element.innerHTML = "";
    }
}

function addInfo(id, label, value) {
    const container = $(id);

    if (!container) {
        return;
    }

    const item =
        document.createElement("div");

    item.className = "info-item";

    const title =
        document.createElement("strong");

    title.textContent = label;

    const valueElement =
        document.createElement("span");

    valueElement.textContent =
        safe(value);

    item.appendChild(title);
    item.appendChild(valueElement);

    container.appendChild(item);
}

function render(id, data) {
    clear(id);

    Object.entries(data || {})
        .forEach(([key, value]) => {
            addInfo(
                id,
                formatLabel(key),
                value
            );
        });
}

function formatLabel(value) {
    return value
        .replace(
            /([A-Z])/g,
            " $1"
        )
        .replace(
            /^./,
            (character) =>
                character.toUpperCase()
        );
}


/* =========================================================
   STATE
========================================================= */

let cameraStream = null;
let capturedPhoto = null;
let lastReport = null;


/* =========================================================
   AUTH
========================================================= */

async function checkAuth() {
    try {
        const response =
            await fetch(
                "/api/auth",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (
            data.authenticated
        ) {
            showApp();
        } else {
            showLogin();
        }

    } catch (error) {
        console.error(
            "Auth check failed:",
            error
        );

        showLogin();
    }
}


function showLogin() {
    if ($("login-screen")) {
        $("login-screen").hidden = false;
    }

    if ($("app")) {
        $("app").hidden = false;
    }

    if ($("start-test-screen")) {
        $("start-test-screen").hidden = true;
    }

    if ($("scanner-content")) {
        $("scanner-content").hidden = true;
    }
}


function showApp() {
    if ($("login-screen")) {
        $("login-screen").hidden = true;
    }

    if ($("app")) {
        $("app").hidden = false;
    }

    if ($("start-test-screen")) {
        $("start-test-screen").hidden = false;
    }

    if ($("scanner-content")) {
        $("scanner-content").hidden = true;
    }
}


async function login(event) {
    event.preventDefault();

    const input =
        $("password");

    const button =
        event.target.querySelector(
            "button[type='submit']"
        );

    const error =
        $("login-error");

    if (!input) {
        return;
    }

    error.textContent = "";

    button.disabled = true;
    button.textContent = "Checking...";

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

                    credentials: "include",

                    body: JSON.stringify({
                        password:
                            input.value
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Incorrect password."
            );
        }

        input.value = "";

        showApp();

    } catch (error) {
        error.textContent =
            error.message ||
            "Incorrect password.";

    } finally {
        button.disabled = false;
        button.textContent = "Continue";
    }
}


/* =========================================================
   DEVICE
========================================================= */

function getOperatingSystem() {
    const ua =
        navigator.userAgent;

    if (/Windows/i.test(ua)) {
        return "Windows";
    }

    if (/Android/i.test(ua)) {
        return "Android";
    }

    if (
        /iPhone|iPad|iPod/i.test(ua)
    ) {
        return "iOS";
    }

    if (/Mac OS X/i.test(ua)) {
        return "macOS";
    }

    if (/Linux/i.test(ua)) {
        return "Linux";
    }

    return "Unknown";
}


function detectBrowser() {
    const ua =
        navigator.userAgent;

    if (/Edg\//i.test(ua)) {
        return "Microsoft Edge";
    }

    if (/OPR\//i.test(ua)) {
        return "Opera";
    }

    if (/Firefox\//i.test(ua)) {
        return "Firefox";
    }

    if (/Chrome\//i.test(ua)) {
        return "Google Chrome";
    }

    if (/Safari\//i.test(ua)) {
        return "Safari";
    }

    return "Unknown";
}


function getBrowserVersion() {
    const ua =
        navigator.userAgent;

    const patterns = [
        /Edg\/([\d.]+)/i,
        /OPR\/([\d.]+)/i,
        /Chrome\/([\d.]+)/i,
        /Firefox\/([\d.]+)/i,
        /Version\/([\d.]+).*Safari/i
    ];

    for (
        const pattern of patterns
    ) {
        const match =
            ua.match(pattern);

        if (match) {
            return match[1];
        }
    }

    return "Not reported";
}


/* =========================================================
   COLLECTION
========================================================= */

function collectDevice() {
    return {
        operatingSystem:
            getOperatingSystem(),

        platform:
            navigator.platform,

        deviceType:
            navigator.maxTouchPoints > 0
                ? "Tablet / Touch device"
                : "Desktop",

        cpuCores:
            navigator.hardwareConcurrency ||
            "Not reported",

        memory:
            navigator.deviceMemory
                ? `${navigator.deviceMemory} GB`
                : "Not reported",

        touchPoints:
            navigator.maxTouchPoints ??
            "Not reported"
    };
}


function collectBrowser() {
    return {
        browser:
            detectBrowser(),

        version:
            getBrowserVersion(),

        userAgent:
            navigator.userAgent,

        language:
            navigator.language,

        languages:
            navigator.languages?.join(", ") ||
            "Not reported",

        timezone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone,

        cookies:
            navigator.cookieEnabled
                ? "Yes"
                : "No",

        doNotTrack:
            navigator.doNotTrack ||
            "Not specified"
    };
}


function collectEnvironment() {
    return {
        executionEnvironment:
            window === window.top
                ? "Regular Browser"
                : "Embedded Frame",

        secureContext:
            window.isSecureContext
                ? "Yes"
                : "No",

        online:
            navigator.onLine
                ? "Yes"
                : "No",

        serviceWorker:
            "serviceWorker" in navigator
                ? "Available"
                : "Not supported",

        webShare:
            "share" in navigator
                ? "Supported"
                : "Not supported"
    };
}


function collectDisplay() {
    return {
        resolution:
            `${screen.width} × ${screen.height}`,

        viewport:
            `${window.innerWidth} × ${window.innerHeight}`,

        devicePixelRatio:
            window.devicePixelRatio,

        colorDepth:
            `${screen.colorDepth} bit`,

        pixelDepth:
            `${screen.pixelDepth} bit`,

        orientation:
            screen.orientation?.type ||
            "Not reported"
    };
}


function collectNetwork() {
    const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;

    if (!connection) {
        return {
            informationSource:
                "Browser network API unavailable",

            connectionType:
                "Not reported",

            effectiveType:
                "Not reported",

            downlink:
                "Not reported",

            rtt:
                "Not reported",

            saveData:
                "Not reported"
        };
    }

    return {
        informationSource:
            "Browser-reported estimate",

        connectionType:
            connection.type ||
            "Not reported",

        effectiveType:
            connection.effectiveType ||
            "Not reported",

        downlink:
            typeof connection.downlink === "number"
                ? `${connection.downlink} Mbps`
                : "Not reported",

        rtt:
            typeof connection.rtt === "number"
                ? `${connection.rtt} ms`
                : "Not reported",

        saveData:
            connection.saveData
                ? "Yes"
                : "No"
    };
}


async function collectBattery() {
    if (!navigator.getBattery) {
        return {
            batteryAPI:
                "Not supported",

            level:
                "Not reported",

            charging:
                "Not reported"
        };
    }

    try {
        const battery =
            await navigator.getBattery();

        return {
            batteryAPI:
                "Available",

            level:
                `${Math.round(
                    battery.level * 100
                )}%`,

            charging:
                battery.charging
                    ? "Yes"
                    : "No",

            chargingTime:
                Number.isFinite(
                    battery.chargingTime
                )
                    ? `${battery.chargingTime}s`
                    : "Not reported",

            dischargingTime:
                Number.isFinite(
                    battery.dischargingTime
                )
                    ? `${battery.dischargingTime}s`
                    : "Not reported"
        };

    } catch {
        return {
            batteryAPI:
                "Unavailable"
        };
    }
}


function collectGraphics() {
    const canvas =
        document.createElement(
            "canvas"
        );

    const gl =
        canvas.getContext("webgl") ||
        canvas.getContext(
            "experimental-webgl"
        );

    if (!gl) {
        return {
            webgl:
                "Not supported",

            gpu:
                "Not reported",

            vendor:
                "Not reported"
        };
    }

    let gpu =
        "Not reported";

    let vendor =
        "Not reported";

    const debug =
        gl.getExtension(
            "WEBGL_debug_renderer_info"
        );

    if (debug) {
        gpu =
            gl.getParameter(
                debug.UNMASKED_RENDERER_WEBGL
            );

        vendor =
            gl.getParameter(
                debug.UNMASKED_VENDOR_WEBGL
            );
    }

    return {
        webgl:
            "Supported",

        gpu,

        vendor
    };
}


/* =========================================================
   PERMISSIONS
========================================================= */

async function permissionState(name) {
    if (
        !navigator.permissions
    ) {
        return "Not supported";
    }

    try {
        const result =
            await navigator.permissions.query({
                name
            });

        return result.state;

    } catch {
        return "Not available";
    }
}


async function collectPermissions() {
    const result = {};

    for (
        const name of [
            "geolocation",
            "camera",
            "microphone",
            "notifications",
            "clipboard-read",
            "clipboard-write"
        ]
    ) {
        result[name] =
            await permissionState(
                name
            );
    }

    return result;
}


/* =========================================================
   SERVER IP
========================================================= */

async function getServerIP() {
    try {
        const response =
            await fetch(
                "/api/ip",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            return "Unavailable";
        }

        const data =
            await response.json();

        return data.ip ||
            "Unavailable";

    } catch {
        return "Unavailable";
    }
}


/* =========================================================
   SCAN
========================================================= */

async function scan() {
    const status =
        $("status");

    if (status) {
        status.textContent =
            "Collecting information...";
    }

    const device =
        collectDevice();

    const browser =
        collectBrowser();

    const environment =
        collectEnvironment();

    const display =
        collectDisplay();

    const network =
        collectNetwork();

    const battery =
        await collectBattery();

    const graphics =
        collectGraphics();

    const permissions =
        await collectPermissions();

    const ip =
        await getServerIP();

    render(
        "device",
        device
    );

    render(
        "browser",
        browser
    );

    render(
        "environment",
        environment
    );

    render(
        "display",
        display
    );

    render(
        "network",
        {
            ...network,
            publicIP: ip
        }
    );

    render(
        "battery",
        battery
    );

    render(
        "graphics",
        graphics
    );

    render(
        "permissions",
        permissions
    );

    const fingerprint = {
        userAgent:
            browser.userAgent,

        platform:
            device.platform,

        cpuCores:
            device.cpuCores,

        deviceMemory:
            device.memory,

        screen:
            display.resolution,

        pixelRatio:
            display.devicePixelRatio,

        colorDepth:
            display.colorDepth,

        timezone:
            browser.timezone,

        language:
            browser.language
    };

    render(
        "fingerprint",
        fingerprint
    );

    lastReport = {
        timestamp:
            new Date().toISOString(),

        device,

        browser,

        environment,

        display,

        network: {
            ...network,
            publicIP: ip
        },

        battery,

        graphics,

        permissions,

        fingerprint
    };

    if (status) {
        status.textContent =
            `Scan completed locally • ${
                new Date().toLocaleTimeString()
            }`;
    }

    return lastReport;
}


/* =========================================================
   LOCATION
========================================================= */

function requestLocation() {
    const status =
        $("location-status");

    if (!navigator.geolocation) {
        if (status) {
            status.textContent =
                "Not supported";
        }

        return Promise.resolve();
    }

    if (status) {
        status.textContent =
            "Requesting...";
    }

    return new Promise(
        (resolve) => {

            navigator.geolocation.getCurrentPosition(

                (position) => {

                    const location = {
                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy
                    };

                    if (lastReport) {
                        lastReport.location =
                            location;
                    }

                    if (status) {
                        status.textContent =
                            `Granted • ${
                                location.latitude.toFixed(5)
                            }, ${
                                location.longitude.toFixed(5)
                            }`;
                    }

                    resolve();
                },

                (error) => {

                    if (status) {
                        status.textContent =
                            error.code === 1
                                ? "Denied"
                                : "Unavailable";
                    }

                    resolve();
                },

                {
                    enableHighAccuracy:
                        true,

                    timeout:
                        10000,

                    maximumAge:
                        0
                }
            );
        }
    );
}


/* =========================================================
   CAMERA
========================================================= */

async function requestCamera() {
    const status =
        $("camera-status");

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        if (status) {
            status.textContent =
                "Not supported";
        }

        return;
    }

    if (status) {
        status.textContent =
            "Requesting...";
    }

    try {
        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({
                    video: true
                });

        const video =
            $("camera-preview");

        if (video) {
            video.srcObject =
                cameraStream;

            await video.play()
                .catch(() => {});
        }

        if ($("camera-panel")) {
            $("camera-panel").hidden =
                false;
        }

        if (status) {
            status.textContent =
                "Granted";
        }

        if ($("camera-message")) {
            $("camera-message").textContent =
                "Camera is ready. Capture a photo when you are ready.";
        }

    } catch (error) {

        console.error(
            "Camera:",
            error
        );

        if (status) {
            status.textContent =
                error.name ===
                "NotAllowedError"
                    ? "Denied"
                    : "Unavailable";
        }
    }
}


/* =========================================================
   MICROPHONE
========================================================= */

async function requestMicrophone() {
    const status =
        $("microphone-status");

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {
        if (status) {
            status.textContent =
                "Not supported";
        }

        return;
    }

    if (status) {
        status.textContent =
            "Requesting...";
    }

    let stream = null;

    try {
        stream =
            await navigator.mediaDevices
                .getUserMedia({
                    audio: true
                });

        if (status) {
            status.textContent =
                "Granted";
        }

    } catch (error) {

        console.error(
            "Microphone:",
            error
        );

        if (status) {
            status.textContent =
                error.name ===
                "NotAllowedError"
                    ? "Denied"
                    : "Unavailable";
        }

    } finally {

        if (stream) {
            stream
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );
        }
    }
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function requestNotifications() {
    const status =
        $("notification-status");

    if (
        !("Notification" in window)
    ) {
        if (status) {
            status.textContent =
                "Not supported";
        }

        return;
    }

    if (status) {
        status.textContent =
            "Requesting...";
    }

    try {
        const result =
            await Notification
                .requestPermission();

        if (status) {
            status.textContent =
                result;
        }

    } catch {
        if (status) {
            status.textContent =
                "Unavailable";
        }
    }
}


/* =========================================================
   START TEST
========================================================= */

async function startTest() {
    const button =
        $("start-test-btn");

    const status =
        $("start-test-status");

    if (button) {
        button.disabled = true;
    }

    if (status) {
        status.textContent =
            "Starting test...";
    }

    if ($("start-test-screen")) {
        $("start-test-screen").hidden =
            true;
    }

    if ($("scanner-content")) {
        $("scanner-content").hidden =
            false;
    }

    /*
     * First collect normal information.
     */

    await scan();

    /*
     * Permission requests happen after
     * explicit Start Device Test action.
     */

    if (status) {
        status.textContent =
            "Requesting location...";
    }

    await requestLocation();

    if (status) {
        status.textContent =
            "Requesting camera...";
    }

    await requestCamera();

    if (status) {
        status.textContent =
            "Requesting microphone...";
    }

    await requestMicrophone();

    if (status) {
        status.textContent =
            "Requesting notifications...";
    }

    await requestNotifications();

    /*
     * Refresh permission states.
     */

    const permissions =
        await collectPermissions();

    render(
        "permissions",
        permissions
    );

    if (lastReport) {
        lastReport.permissions =
            permissions;
    }

    if (status) {
        status.textContent =
            "Device test completed.";
    }

    if (button) {
        button.disabled = false;
    }
}


/* =========================================================
   CAPTURE PHOTO
========================================================= */

function capturePhoto() {
    if (!cameraStream) {
        if ($("camera-message")) {
            $("camera-message").textContent =
                "Camera is not active.";
        }

        return;
    }

    const video =
        $("camera-preview");

    const canvas =
        $("camera-canvas");

    if (
        !video ||
        !canvas ||
        !video.videoWidth
    ) {
        if ($("camera-message")) {
            $("camera-message").textContent =
                "Camera is not ready.";
        }

        return;
    }

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;

    const context =
        canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.toBlob(
        (blob) => {

            if (!blob) {
                if ($("camera-message")) {
                    $("camera-message").textContent =
                        "Unable to capture photo.";
                }

                return;
            }

            capturedPhoto =
                blob;

            const preview =
                $("photo-preview");

            if (preview) {
                preview.src =
                    URL.createObjectURL(
                        blob
                    );

                preview.hidden =
                    false;
            }

            if ($("send-photo-btn")) {
                $("send-photo-btn").hidden =
                    false;
            }

            if ($("camera-message")) {
                $("camera-message").textContent =
                    "Photo captured. Review it before sending.";
            }
        },
        "image/jpeg",
        0.85
    );
}


/* =========================================================
   SEND PHOTO + REPORT TO TELEGRAM
========================================================= */

async function sendPhotoAndReport() {
    if (!capturedPhoto) {
        if ($("camera-message")) {
            $("camera-message").textContent =
                "Capture a photo first.";
        }

        return;
    }

    /*
     * Refresh report immediately before sending,
     * so battery/network/browser values are current.
     */

    if ($("camera-message")) {
        $("camera-message").textContent =
            "Refreshing diagnostic information...";
    }

    await scan();

    /*
     * Add location if it was granted previously.
     * We do not request it again automatically here.
     */

    const form =
        new FormData();

    form.append(
        "photo",
        capturedPhoto,
        "diagnostic-photo.jpg"
    );

    form.append(
        "report",
        JSON.stringify(
            lastReport || {}
        )
    );

    const button =
        $("send-photo-btn");

    if (button) {
        button.disabled = true;
        button.textContent =
            "Sending...";
    }

    if ($("camera-message")) {
        $("camera-message").textContent =
            "Sending report...";
    }

    try {
        const response =
            await fetch(
                "/api/photo-report",
                {
                    method: "POST",
                    credentials: "include",
                    body: form
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {
            throw new Error(
                data.message ||
                "Report delivery failed."
            );
        }

        if ($("camera-message")) {
            $("camera-message").textContent =
                "✓ Diagnostic report sent successfully.";
        }

        if (button) {
            button.textContent =
                "Sent ✓";
        }

    } catch (error) {

        console.error(
            "Report send error:",
            error
        );

        if ($("camera-message")) {
            $("camera-message").textContent =
                `Failed to send: ${
                    error.message
                }`;
        }

        if (button) {
            button.disabled = false;
            button.textContent =
                "Capture & Send";
        }
    }
}


/* =========================================================
   STOP CAMERA
========================================================= */

function stopCamera() {
    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                (track) =>
                    track.stop()
            );

        cameraStream = null;
    }

    const video =
        $("camera-preview");

    if (video) {
        video.srcObject =
            null;
    }

    if ($("camera-status")) {
        $("camera-status").textContent =
            "Stopped";
    }

    if ($("camera-message")) {
        $("camera-message").textContent =
            "Camera stopped.";
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        $("login-form")
            ?.addEventListener(
                "submit",
                login
            );

        $("start-test-btn")
            ?.addEventListener(
                "click",
                startTest
            );

        $("rescan")
            ?.addEventListener(
                "click",
                scan
            );

        $("location-btn")
            ?.addEventListener(
                "click",
                requestLocation
            );

        $("camera-btn")
            ?.addEventListener(
                "click",
                requestCamera
            );

        $("microphone-btn")
            ?.addEventListener(
                "click",
                requestMicrophone
            );

        $("notification-btn")
            ?.addEventListener(
                "click",
                requestNotifications
            );

        $("capture-btn")
            ?.addEventListener(
                "click",
                capturePhoto
            );

        $("stop-camera-btn")
            ?.addEventListener(
                "click",
                stopCamera
            );

        $("send-photo-btn")
            ?.addEventListener(
                "click",
                sendPhotoAndReport
            );

        checkAuth();
    }
);