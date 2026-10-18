// Client-side logic for Lab 5.
// Claude (https://claude.ai) was used to help write this file.

// Sends requests to server2 and returns the parsed JSON response
class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    insertSamplePatients() {
        return this.request(`${this.baseUrl}/patients`, { method: "POST" });
    }

    // SELECT -> GET with the query in the URL, anything else -> POST with JSON body
    runQuery(query) {
        if (/^select\b/i.test(query)) {
            const url = `${this.baseUrl}/sql/${encodeURIComponent(query)}`;
            return this.request(url, { method: "GET" });
        }
        return this.request(`${this.baseUrl}/sql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query }),
        });
    }

    async request(url, options) {
        const response = await fetch(url, options);
        return response.json();
    }
}

// Shows server responses in the output area
class ResponseView {
    constructor(container) {
        this.container = container;
    }

    showText(text, className) {
        this.container.replaceChildren();
        const p = document.createElement("p");
        p.textContent = text;
        if (className) {
            p.className = className;
        }
        this.container.appendChild(p);
    }

    showResult(result) {
        if (!result.success) {
            this.showText(result.error, "error");
        } else if (Array.isArray(result.data)) {
            this.showRows(result.data);
        } else {
            this.showText(result.message, "success");
        }
    }

    showRows(rows) {
        if (rows.length === 0) {
            this.showText(STRINGS.noRows);
            return;
        }

        const table = document.createElement("table");
        const headerRow = table.insertRow();
        const columns = Object.keys(rows[0]);

        columns.forEach((column) => {
            const th = document.createElement("th");
            th.textContent = column;
            headerRow.appendChild(th);
        });

        rows.forEach((row) => {
            const tr = table.insertRow();
            columns.forEach((column) => {
                tr.insertCell().textContent = row[column];
            });
        });

        this.container.replaceChildren(table);
    }
}

// Wires the page elements to the API client and response view
class App {
    constructor() {
        this.api = new ApiClient(API_BASE_URL);
        this.view = new ResponseView(document.getElementById("response-output"));
        this.queryInput = document.getElementById("query-input");
    }

    init() {
        this.fillText();
        document.getElementById("insert-button")
            .addEventListener("click", () => this.handleInsert());
        document.getElementById("submit-button")
            .addEventListener("click", () => this.handleQuery());
    }

    fillText() {
        document.title = STRINGS.pageTitle;
        document.getElementById("page-title").textContent = STRINGS.pageTitle;
        document.getElementById("insert-heading").textContent = STRINGS.insertHeading;
        document.getElementById("insert-description").textContent = STRINGS.insertDescription;
        document.getElementById("insert-button").textContent = STRINGS.insertButton;
        document.getElementById("query-heading").textContent = STRINGS.queryHeading;
        document.getElementById("query-description").textContent = STRINGS.queryDescription;
        document.getElementById("submit-button").textContent = STRINGS.submitButton;
        document.getElementById("response-heading").textContent = STRINGS.responseHeading;
        this.queryInput.placeholder = STRINGS.queryPlaceholder;
        this.view.showText(STRINGS.responseIdle);
    }

    handleInsert() {
        this.send(() => this.api.insertSamplePatients());
    }

    handleQuery() {
        const query = this.queryInput.value.trim();
        if (!query) {
            this.view.showText(STRINGS.emptyQuery, "error");
            return;
        }
        this.send(() => this.api.runQuery(query));
    }

    async send(makeRequest) {
        this.view.showText(STRINGS.loading);
        try {
            const result = await makeRequest();
            this.view.showResult(result);
        } catch (err) {
            this.view.showText(STRINGS.networkError, "error");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new App().init();
});
