
// ==== ELEMENT REFERENCES ====
const userInput = document.getElementById("user");
const passInput = document.getElementById("pass");
const pathInput = document.getElementById("path");
const dataInput = document.getElementById("data");
const outputEl = document.getElementById("output");

const loginIndicator = document.getElementById("login-indicator");
const loginStatusText = document.getElementById("login-status-text");
const currentUserEl = document.getElementById("current-user");
const lastOpEl = document.getElementById("last-op");
const lastStatusEl = document.getElementById("last-status");
const historyList = document.getElementById("history-list");
const pill = document.getElementById("op-status-pill");

const btnRead = document.getElementById("btn-read");
const btnWrite = document.getElementById("btn-write");
const btnDelete = document.getElementById("btn-delete");

let loggedIn = false;
let currentUser = null;

// ==== HELPERS ====
function setButtonsEnabled(enabled) {
    [btnRead, btnWrite, btnDelete].forEach(btn => {
        btn.disabled = !enabled;
    });
}

function setLoginStatus(state, message) {
    // state: "idle" | "success" | "error"
    if (state === "success") {
        loginIndicator.style.background = "#22c55e";
        loginIndicator.style.boxShadow = "0 0 10px rgba(34,197,94,0.8)";
    } else if (state === "error") {
        loginIndicator.style.background = "#ef4444";
        loginIndicator.style.boxShadow = "0 0 10px rgba(239,68,68,0.8)";
    } else {
        loginIndicator.style.background = "#f97316";
        loginIndicator.style.boxShadow = "0 0 10px rgba(248,171,94,0.8)";
    }
    loginStatusText.textContent = message;
}

function setPill(type, text) {
    pill.classList.remove("pill-info", "pill-success", "pill-error");
    if (type === "success") {
        pill.classList.add("pill-success");
    } else if (type === "error") {
        pill.classList.add("pill-error");
    } else {
        pill.classList.add("pill-info");
    }
    pill.textContent = text;
}

function addHistoryEntry(op, status, msg) {
    const li = document.createElement("li");

    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    li.innerHTML = `
        <span class="history-op">${op}</span>
        &nbsp;–&nbsp;<span>${status}</span><br>
        <span class="history-time">${timeStr}</span> • ${msg}
    `;

    historyList.insertBefore(li, historyList.firstChild);
}

// ==== API CALLS ====
function login() {
    const username = userInput.value.trim();
    const password = passInput.value;

    if (!username || !password) {
        setLoginStatus("error", "Username and password required");
        setPill("error", "Login Error");
        outputEl.textContent = "Please enter both username and password.";
        return;
    }

    fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
        .then(r => r.json())
        .then(d => {
            if (d.status === "success") {
                loggedIn = true;
                currentUser = username;
                setButtonsEnabled(true);

                setLoginStatus("success", `Logged in as ${username}`);
                currentUserEl.textContent = username;
                lastOpEl.textContent = "LOGIN";
                lastStatusEl.textContent = "SUCCESS";
                setPill("success", "Login OK");
                outputEl.textContent = "Login successful.";

                addHistoryEntry("LOGIN", "SUCCESS", "User authenticated");
            } else {
                loggedIn = false;
                currentUser = null;
                setButtonsEnabled(false);

                setLoginStatus("error", "Login failed");
                currentUserEl.textContent = "—";
                lastOpEl.textContent = "LOGIN";
                lastStatusEl.textContent = "FAILED";
                setPill("error", "Login Failed");
                outputEl.textContent = "Invalid username or password.";

                addHistoryEntry("LOGIN", "FAILED", "Invalid credentials");
            }
        })
        .catch(err => {
            console.error(err);
            setLoginStatus("error", "Login error");
            setPill("error", "Error");
            outputEl.textContent = "Error during login. Check console.";
        });
}

function readFile() {
    callAPI("/read", { path: pathInput.value }, "READ");
}

function writeFile() {
    callAPI("/write", { path: pathInput.value, data: dataInput.value }, "WRITE");
}

function deleteFile() {
    callAPI("/delete", { path: pathInput.value }, "DELETE");
}

function callAPI(url, body, opName) {
    if (!loggedIn) {
        setPill("error", "Not Logged In");
        outputEl.textContent = "Please login before performing operations.";
        return;
    }

    if (!body.path || body.path.trim() === "") {
        setPill("error", "Missing Path");
        outputEl.textContent = "File path cannot be empty.";
        return;
    }

    setPill("info", `${opName}…`);
    lastOpEl.textContent = opName;
    lastStatusEl.textContent = "PENDING";

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
        .then(r => r.json())
        .then(d => {
            const isSuccess = d.msg && d.msg.toLowerCase().includes("successful");
            const statusType = isSuccess ? "success" : "error";

            outputEl.textContent = d.data || d.msg || "No response";
            setPill(statusType, isSuccess ? "Success" : "Error");
            lastStatusEl.textContent = isSuccess ? "SUCCESS" : "ERROR";

            addHistoryEntry(opName, isSuccess ? "SUCCESS" : "ERROR", d.msg || "No message");
        })
        .catch(err => {
            console.error(err);
            outputEl.textContent = "Request failed. Check console.";
            setPill("error", "Error");
            lastStatusEl.textContent = "ERROR";
            addHistoryEntry(opName, "ERROR", "Request failed");
        });
}

// Init state
setButtonsEnabled(false);
setLoginStatus("idle", "Not logged in");
setPill("info", "Idle");
