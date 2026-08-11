import "dotenv/config";

import http from "node:http";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SITE_PASSWORD = process.env.SITE_PASSWORD;

if (!BOT_TOKEN || !TELEGRAM_CHAT_ID || !SITE_PASSWORD) {
    console.error(
        "Missing BOT_TOKEN, TELEGRAM_CHAT_ID, or SITE_PASSWORD in .env"
    );
    process.exit(1);
}

// In-memory sessions.
// They disappear automatically when the server restarts.
const sessions = new Map();

function createSession() {
    const token = crypto.randomBytes(32).toString("hex");

    sessions.set(token, {
        createdAt: Date.now()
    });

    return token;
}

function getSession(request) {
    const cookie = request.headers.cookie || "";

    const match = cookie.match(
        /(?:^|;\s*)session=([^;]+)/
    );

    if (!match) {
        return null;
    }

    const session = sessions.get(match[1]);

    if (!session) {
        return null;
    }

    // 12-hour session lifetime.
    if (Date.now() - session.createdAt > 12 * 60 * 60 * 1000) {
        sessions.delete(match[1]);
        return null;
    }

    return match[1];
}

function getClientIP(request) {
    return request.socket.remoteAddress || null;
}

function isLocalAddress(ip) {
    return (
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip === "localhost"
    );
}

function normalizeIP(ip) {
    if (!ip) {
        return null;
    }

    if (ip.startsWith("::ffff:")) {
        return ip.substring(7);
    }

    return ip;
}

function getContentType(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    const types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8"
    };

    return types[extension] || "application/octet-stream";
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";

        request.on("data", chunk => {
            body += chunk;

            if (body.length > 100_000) {
                reject(new Error("Request body too large"));
                request.destroy();
            }
        });

        request.on("end", () => resolve(body));
        request.on("error", reject);
    });
}

function json(response, status, data) {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });

    response.end(JSON.stringify(data));
}

async function sendTelegramReport(report) {
    const url =
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: report
        })
    });

    if (!response.ok) {
        throw new Error(
            `Telegram API returned ${response.status}`
        );
    }
}

function formatReport(data, request) {
    const rawIP = normalizeIP(getClientIP(request));

    const ip = rawIP
        ? isLocalAddress(rawIP)
            ? "Localhost"
            : rawIP
        : "Unavailable";

    const safe = value =>
        value === undefined ||
        value === null ||
        value === ""
            ? "Not reported"
            : String(value);

    return [
        "🖥 DEVICE INFORMATION",
        "",
        `OS: ${safe(data.device?.os)}`,
        `Platform: ${safe(data.device?.platform)}`,
        `Device Type: ${safe(data.device?.type)}`,
        `CPU Cores: ${safe(data.device?.cpuCores)}`,
        `Memory: ${safe(data.device?.memory)}`,
        "",
        "🌐 BROWSER",
        "",
        `Browser: ${safe(data.browser?.name)}`,
        `Version: ${safe(data.browser?.version)}`,
        `Language: ${safe(data.browser?.language)}`,
        `Timezone: ${safe(data.browser?.timezone)}`,
        "",
        "📺 DISPLAY",
        "",
        `Resolution: ${safe(data.display?.resolution)}`,
        `Viewport: ${safe(data.display?.viewport)}`,
        `Pixel Ratio: ${safe(data.display?.pixelRatio)}`,
        `Color Depth: ${safe(data.display?.colorDepth)}`,
        "",
        "🌐 NETWORK",
        "",
        `Public IP: ${ip}`,
        `Connection: ${safe(data.network?.effectiveType)}`,
        `Downlink: ${safe(data.network?.downlink)}`,
        `RTT: ${safe(data.network?.rtt)}`,
        "",
        "🔋 BATTERY",
        "",
        `Level: ${safe(data.battery?.level)}`,
        `Charging: ${safe(data.battery?.charging)}`,
        "",
        "🎮 GRAPHICS",
        "",
        `GPU: ${safe(data.graphics?.renderer)}`,
        "",
        "🔐 PERMISSIONS",
        "",
        `Geolocation: ${safe(data.permissions?.geolocation)}`,
        `Camera: ${safe(data.permissions?.camera)}`,
        `Microphone: ${safe(data.permissions?.microphone)}`,
        `Notifications: ${safe(data.permissions?.notifications)}`,
        "",
        `🕒 Report time: ${new Date().toISOString()}`
    ].join("\n");
}

const server = http.createServer(async (request, response) => {
    try {
        const url = new URL(
            request.url,
            `http://${request.headers.host || "localhost"}`
        );

        // Login
        if (
            request.method === "POST" &&
            url.pathname === "/api/login"
        ) {
            const body = await readBody(request);

            let parsed;

            try {
                parsed = JSON.parse(body);
            } catch {
                json(response, 400, {
                    success: false,
                    error: "Invalid request"
                });
                return;
            }

            const password = String(parsed.password || "");

            if (
                password.length === 0 ||
                password !== SITE_PASSWORD
            ) {
                json(response, 401, {
                    success: false,
                    error: "Invalid password"
                });
                return;
            }

            const session = createSession();

            response.writeHead(200, {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store",
                "Set-Cookie":
                    `session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`
            });

            response.end(
                JSON.stringify({
                    success: true
                })
            );

            return;
        }

        // Authentication status
        if (
            request.method === "GET" &&
            url.pathname === "/api/auth"
        ) {
            json(response, 200, {
                authenticated: Boolean(getSession(request))
            });

            return;
        }

        // IP endpoint
        if (
            request.method === "GET" &&
            url.pathname === "/api/ip"
        ) {
            if (!getSession(request)) {
                json(response, 401, {
                    error: "Authentication required"
                });
                return;
            }

            const ip = normalizeIP(getClientIP(request));

            json(response, 200, {
                ip: isLocalAddress(ip)
                    ? null
                    : ip,
                local: isLocalAddress(ip),
                stored: false
            });

            return;
        }

        // Telegram report endpoint
        if (
            request.method === "POST" &&
            url.pathname === "/api/report"
        ) {
            if (!getSession(request)) {
                json(response, 401, {
                    success: false,
                    error: "Authentication required"
                });
                return;
            }

            const body = await readBody(request);

            let data;

            try {
                data = JSON.parse(body);
            } catch {
                json(response, 400, {
                    success: false,
                    error: "Invalid report"
                });
                return;
            }

            const report = formatReport(data, request);

            await sendTelegramReport(report);

            json(response, 200, {
                success: true
            });

            return;
        }

        // Static files
        if (request.method !== "GET") {
            response.writeHead(405);
            response.end("Method Not Allowed");
            return;
        }

        const requestedPath =
            url.pathname === "/"
                ? "/index.html"
                : url.pathname;

        const safePath = path.normalize(
            requestedPath.replace(/^[/\\]+/, "")
        );

        const filePath = path.join(
            PUBLIC_DIR,
            safePath
        );

        if (
            filePath !== PUBLIC_DIR &&
            !filePath.startsWith(
                `${PUBLIC_DIR}${path.sep}`
            )
        ) {
            response.writeHead(403);
            response.end("Forbidden");
            return;
        }

        const content = await readFile(filePath);

        response.writeHead(200, {
            "Content-Type": getContentType(filePath),
            "Cache-Control": "no-store"
        });

        response.end(content);
    } catch (error) {
        console.error("Server error:", error.message);

        if (!response.headersSent) {
            response.writeHead(500);
            response.end("Internal Server Error");
        }
    }
});

server.listen(PORT, () => {
    console.log(
        `Testing-URL running at http://localhost:${PORT}`
    );
});