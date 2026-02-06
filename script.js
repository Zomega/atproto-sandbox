import { BrowserOAuthClient } from "https://esm.sh/@atproto/oauth-client-browser@0.2.0?bundle";
import { BskyAgent } from "https://esm.sh/@atproto/api@0.13.0?bundle";

// Since we are hosting on the same domain, we point to our local metadata
const METADATA_URL = "https://zomega.github.io/atproto-sandbox/client-metadata.json";

let client;
let agent;

async function init() {
    const statusEl = document.getElementById("status");
    console.log("App initializing...");

    try {
        // 1. Fetch metadata
        const response = await fetch(METADATA_URL);
        const metadata = await response.json();

        // 2. Initialize Client
        client = new BrowserOAuthClient({
            handleResolver: "https://bsky.social",
            clientMetadata: metadata 
        });

        // 3. Check for session (handles the redirect automatically)
        const result = await client.init();

        if (result?.session) {
            setupGameUI(result.session);
        } else {
            console.log("No session found, waiting for user login.");
            statusEl.innerText = "Please log in to continue.";
        }
    } catch (err) {
        console.error("Initialization failed:", err);
        statusEl.innerText = "Error: " + err.message;
    }
}

function setupGameUI(session) {
    agent = new BskyAgent(session);
    
    // Toggle Sections
    document.getElementById("login-section").style.display = "none";
    document.getElementById("game-section").style.display = "block";
    
    document.getElementById("user-info").innerText = `Logged in as: ${session.did}`;
    console.log("Session active:", session);
}

async function login() {
    const handle = document.getElementById('handle').value.trim();
    if (!handle) return alert("Enter your handle (e.g., will.bsky.social)");

    try {
        // Redirect to PDS
        const { url } = await client.signIn(handle, {
            scope: "atproto",
            ui_locales: 'en',
        });
        window.location.href = url;
    } catch (err) {
        console.error("Login failed:", err);
        alert("Login failed: " + err.message);
    }
}

// Bind Events
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("login-btn").addEventListener("click", login);
    init();
});
