// User-facing strings for server2
// Claude (https://claude.ai) was used to help write this file.

const MESSAGES = {
    serverRunning: "Server running on port %PORT%",
    insertSuccess: "Rows inserted: %COUNT%",
    queryEmpty: "Query is empty",
    queryMissing: "Request body must be JSON like {\"query\": \"INSERT ...\"}",
    bodyTooLarge: "Request body is too large",
    invalidJson: "Request body is not valid JSON",
    notFound: "Route not found",
    dbError: "Database error: %ERROR%",
    serverError: "Internal server error",
};

module.exports = MESSAGES;
