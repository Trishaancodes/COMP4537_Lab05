// Database access for server2: connects with least-privilege users,
// creates the patient table if it does not exist, and runs queries.
// Claude (https://claude.ai) was used to help write this file.

const mysql = require("mysql2/promise");

const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS patient (
        patientid INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        dateOfBirth DATETIME NOT NULL,
        PRIMARY KEY (patientid)
    ) ENGINE=InnoDB`;

const INSERT_DEFAULT_SQL = `
    INSERT INTO patient (name, dateOfBirth) VALUES
    ('Sara Brown', '1901-01-01'),
    ('John Smith', '1941-01-01'),
    ('Jack Ma', '1961-01-30'),
    ('Elon Musk', '1999-01-01')`;

class Database {
    constructor(config) {
        const base = {
            host: config.host,
            port: config.port,
            database: config.database,
            connectionLimit: 5,
        };

        // Writer: CREATE + INSERT + SELECT only (no DROP / DELETE / UPDATE)
        this.writerPool = mysql.createPool({
            ...base,
            user: config.writerUser,
            password: config.writerPassword,
        });

        // Reader: SELECT only
        this.readerPool = mysql.createPool({
            ...base,
            user: config.readerUser,
            password: config.readerPassword,
        });
    }

    async ensurePatientTable() {
        await this.writerPool.query(CREATE_TABLE_SQL);
    }

    async insertDefaultPatients() {
        await this.ensurePatientTable();
        const [result] = await this.writerPool.query(INSERT_DEFAULT_SQL);
        return result;
    }

    // POST: run a user-supplied INSERT as the writer user
    async runWriteQuery(sql) {
        await this.ensurePatientTable();
        const [result] = await this.writerPool.query(sql);
        return result;
    }

    // GET: run a user-supplied SELECT as the read-only user
    async runReadQuery(sql) {
        await this.ensurePatientTable();
        const [rows] = await this.readerPool.query(sql);
        return rows;
    }

    async close() {
        await Promise.all([this.writerPool.end(), this.readerPool.end()]);
    }
}

module.exports = Database;
