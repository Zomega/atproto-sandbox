import { BrowserOAuthClient } from "https://esm.sh/@atproto/oauth-client-browser@0.3.0?bundle";
import { Agent } from "https://esm.sh/@atproto/api@0.18.20?bundle";

const METADATA_URL = "https://zomega.github.io/atproto-sandbox/client-metadata.json";

// We keep these global to access them for debugging
let client;
let agent;

async function init() {
    const statusEl = document.getElementById("status");
    console.log("App initializing...");

    try {
        const response = await fetch(METADATA_URL);
        const metadata = await response.json();

        client = new BrowserOAuthClient({
            handleResolver: "https://bsky.social",
            clientMetadata: metadata 
        });

        window.client = client; 
        console.log("🛠️ window.client is ready");

        // This handles the redirect return automatically
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

async function setupGameUI(oauthSession) {
    window.oauthSession = oauthSession;
    console.log("🛠️ window.oauthSession is ready");

    console.log("Initializing Agent with valid session...");

    // 1. The Correct Way to Init:
    // The Agent constructor in 0.18+ is smart enough to take the OAuth session directly.
    agent = new Agent(oauthSession);

    window.agent = agent;
    console.log("🛠️ window.agent is ready");

    // Toggle UI
    document.getElementById("login-section").style.display = "none";
    document.getElementById("game-section").style.display = "block";
    document.getElementById("user-info").innerText = "Authenticated. Loading profile...";

    // 2. The Fix:
    // The agent doesn't have 'agent.session', so we pass the DID from the oauthSession.
    await fetchMyProfile(oauthSession.sub);
}

async function fetchMyProfile(did) {
    try {
        console.log("Fetching profile for:", did);
        
        // We use the agent to make the authenticated call
        const response = await agent.getProfile({ actor: did });
        const profile = response.data;

        console.log("Profile fetched:", profile);

        document.getElementById("user-info").innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <img src="${profile.avatar}" style="width:50px; height:50px; border-radius:50%; border: 2px solid var(--accent-color);">
                <div style="text-align: left;">
                    <div style="font-weight: bold;">${profile.displayName || profile.handle}</div>
                    <div style="font-size: 0.8em; opacity: 0.8;">@${profile.handle}</div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Failed to fetch profile:", err);
        // This gives us the exact error from the server (e.g. 401, 403)
        document.getElementById("user-info").innerText = "Error: " + err.message;
    }
}

async function login() {
    const handle = document.getElementById('handle').value.trim();
    if (!handle) return alert("Enter your handle");

    try {
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

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("login-btn").addEventListener("click", login);
    init();
});
