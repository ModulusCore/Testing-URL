import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

function normalizeIP(ip) {
    if (!ip) {
        return null;
    }

    // IPv4-mapped IPv6 address:
    // ::ffff:192.168.1.10 -> 192.168.1.10
    if (ip.startsWith("::ffff:")) {
        return ip.substring(7);
    }

    return ip;
}

function getClientIP(request) {
    /*
     * For local development we use the direct socket address.
     *
     * In production, a trusted reverse proxy should be configured
     * before trusting forwarding headers such as X-Forwarded-For.
     */
    return normalizeIP(request.socket.remoteAddress);
}

function isLocalAddress(ip) {
    if (!ip) {
        return false;
    }

    return (
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip === "localhost"
    );
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

const server = http.createServer(async (request, response) => {
    try {
        if (request.url === "/api/ip") {
            const ip = getClientIP(request);
            const local = isLocalAddress(ip);

            response.writeHead(200, {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store"
            });

            response.end(
                JSON.stringify({
                    ip: local ? null : ip,
                    local,
                    stored: false
                })
            );

            return;
        }

        const requestedPath =
            request.url === "/" ? "/index.html" : request.url;

        const cleanPath = requestedPath.split("?")[0];

        const safePath = path.normalize(
            cleanPath.replace(/^[/\\]+/, "")
        );

        const filePath = path.join(PUBLIC_DIR, safePath);

        if (
            filePath !== PUBLIC_DIR &&
            !filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)
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
    } catch {
        response.writeHead(404);
        response.end("Not Found");
    }
});

server.listen(PORT, () => {
    console.log(
        `Testing-URL running at http://localhost:${PORT}`
    );
});