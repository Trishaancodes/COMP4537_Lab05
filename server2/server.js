// Server2: Node http API for Lab 5 (no express / routing modules).
// Claude (https://claude.ai) was used to help write this file.
//
// Routes:
//   GET  /lab5/api/v1/sql/<url-encoded SELECT>  -> runs as read-only DB user
//   POST /lab5/api/v1/sql       body {"query"}  -> runs as writer DB user
//   POST /lab5/api/v1/patients                  -> inserts the 4 sample rows

const http = require("http");
const Database = require("./modules/db");
const MESSAGES = require("./lang/en/en");

const API_BASE = "/lab5/api/v1";
const SQL_PATH = `${API_BASE}/sql`;
const PATIENTS_PATH = `${API_BASE}/patients`;
const MAX_BODY_BYTES = 1e6;

class ApiServer {
    constructor(port, allowedOrigin, db) {
        this.port = port;
        this.allowedOrigin = allowedOrigin;
        this.db = db;
    }

    start() {
        const server = http.createServer((req, res) => this.handle(req, res));
        server.listen(this.port, () => {
            console.log(MESSAGES.serverRunning.replace("%PORT%", this.port));
        });
    }

    async handle(req, res) {
        this.setCorsHeaders(res);

        // Browser preflight for cross-origin POST with JSON
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

        const path = new URL(req.url, `http://${req.headers.host}`).pathname;

        try {
            if (req.method === "GET" && path.startsWith(`${SQL_PATH}/`)) {
                await this.handleSelect(res, path);
            } else if (req.method === "POST" && path === SQL_PATH) {
                await this.handleWrite(req, res);
            } else if (req.method === "POST" && path === PATIENTS_PATH) {
                await this.handleInsertDefaults(res);
            } else {
                this.sendJson(res, 404, { success: false, error: MESSAGES.notFound });
            }
        } catch (err) {
            this.sendError(res, err);
        }
    }

    async handleSelect(res, path) {
        const rawQuery = decodeURIComponent(path.slice(SQL_PATH.length + 1));
        const sql = this.cleanQuery(rawQuery);
        if (!sql) {
            this.sendJson(res, 400, { success: false, error: MESSAGES.queryEmpty });
            return;
        }
        const rows = await this.db.runReadQuery(sql);
        this.sendJson(res, 200, { success: true, data: rows });
    }

    async handleWrite(req, res) {
        const body = await this.readJsonBody(req);
        if (typeof body.query !== "string") {
            this.sendJson(res, 400, { success: false, error: MESSAGES.queryMissing });
            return;
        }
        const sql = this.cleanQuery(body.query);
        if (!sql) {
            this.sendJson(res, 400, { success: false, error: MESSAGES.queryEmpty });
            return;
        }
        const result = await this.db.runWriteQuery(sql);
        this.sendInsertResult(res, result);
    }

    async handleInsertDefaults(res) {
        const result = await this.db.insertDefaultPatients();
        this.sendInsertResult(res, result);
    }

    sendInsertResult(res, result) {
        // A SELECT sent by POST returns rows (an array) instead of a result object
        if (Array.isArray(result)) {
            this.sendJson(res, 200, { success: true, data: result });
            return;
        }
        this.sendJson(res, 200, {
            success: true,
            message: MESSAGES.insertSuccess.replace("%COUNT%", result.affectedRows),
            affectedRows: result.affectedRows,
        });
    }

    // Trim whitespace and the optional surrounding quotes: "select * from patient"
    cleanQuery(query) {
        let sql = query.trim();
        if (sql.length >= 2 && sql.startsWith("\"") && sql.endsWith("\"")) {
            sql = sql.slice(1, -1).trim();
        }
        return sql;
    }

    readJsonBody(req) {
        return new Promise((resolve, reject) => {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk;
                if (body.length > MAX_BODY_BYTES) {
                    reject(new ClientError(413, MESSAGES.bodyTooLarge));
                    req.destroy();
                }
            });
            req.on("end", () => {
                try {
                    resolve(JSON.parse(body || "{}"));
                } catch (err) {
                    reject(new ClientError(400, MESSAGES.invalidJson));
                }
            });
            req.on("error", reject);
        });
    }

    setCorsHeaders(res) {
        res.setHeader("Access-Control-Allow-Origin", this.allowedOrigin);
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    sendJson(res, status, payload) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(payload));
    }

    sendError(res, err) {
        if (err instanceof ClientError) {
            this.sendJson(res, err.status, { success: false, error: err.message });
        } else if (err.sqlMessage) {
            // e.g. "DROP command denied to user 'lab5_writer'..."
            this.sendJson(res, 400, {
                success: false,
                error: MESSAGES.dbError.replace("%ERROR%", err.sqlMessage),
            });
        } else {
            console.error(err);
            this.sendJson(res, 500, { success: false, error: MESSAGES.serverError });
        }
    }
}

class ClientError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const db = new Database({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    writerUser: process.env.DB_WRITER_USER,
    writerPassword: process.env.DB_WRITER_PASSWORD,
    readerUser: process.env.DB_READER_USER,
    readerPassword: process.env.DB_READER_PASSWORD,
});

const apiServer = new ApiServer(
    Number(process.env.PORT) || 3000,
    process.env.ALLOWED_ORIGIN || "*",
    db
);
apiServer.start();
