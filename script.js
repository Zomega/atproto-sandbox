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

async function fetchMyProfile() {
    try {
        // 'getProfile' is the standard way to get user details
        const response = await agent.getProfile({ actor: agent.session.did });
        const profile = response.data;

        console.log("Profile fetched:", profile);

        // Update the UI with your actual display name and avatar
        document.getElementById("user-info").innerHTML = `
            <img src="${profile.avatar}" style="width:50px; border-radius:50%; vertical-align:middle; margin-right:10px;">
            <strong>${profile.displayName || profile.handle}</strong>
        `;
    } catch (err) {
        console.error("Failed to fetch profile:", err);
    }
}

async function findWordlePosts() {
    try {
        // Search for the classic Wordle grid pattern
        const response = await agent.app.bsky.feed.searchPosts({
            q: "Wordle 🟩",
            limit: 5
        });

        console.log("Recent Wordle posts:", response.data.posts);
    } catch (err) {
        console.error("Search failed:", err);
    }
}

async function setupGameUI(oauthSession) {
    // 1. Create the agent using the specialized agent creator from the session
    // This ensures the agent uses the correct DPoP headers automatically
    agent = new BskyAgent(oauthSession);
    
    // 2. Toggle UI
    document.getElementById("login-section").style.display = "none";
    document.getElementById("game-section").style.display = "block";
    document.getElementById("user-info").innerText = "Fetching your profile...";

    // 3. Call your read functions
    await fetchMyProfile();
    findWordlePosts();
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
