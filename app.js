
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";

/* ===== Replace with your Firebase config (kept as you provided) ===== */
const firebaseConfig = {
  apiKey: "AIzaSyD0qZ07F92qGEQPn53G_mynPkexWPsOEZ8",
  authDomain: "realtimechatapp-99719.firebaseapp.com",
  projectId: "realtimechatapp-99719",
  storageBucket: "realtimechatapp-99719.firebasestorage.app",
  messagingSenderId: "416084187635",
  appId: "1:416084187635:web:e0fa3dbb7192d1ed7fda86",
  measurementId: "G-JC9HYGEN24"
};
/* =================================================================== */

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { /* analytics optional */ }
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

/* ---------- small DOM helpers ---------- */
const q = (sel, root = document) => root.querySelector(sel);
const onIf = (sel, cb, root = document) => { const el = q(sel, root); if (el) el.addEventListener('click', cb); return el; };

/* ---------- Landing / index: Google sign-in & navigate to signup ---------- */
onIf(".btn-google", async (ev) => {
  ev.preventDefault();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    alert(`✅ Google Sign-in successful!\nWelcome ${user.displayName || user.email}`);

    // Optional: store basic profile in realtime db
    try {
      await set(ref(db, `users/${user.uid}`), {
        name: user.displayName || null,
        email: user.email || null,
        photoURL: user.photoURL || null,
        createdAt: Date.now()
      });
    } catch (dbErr) {
      console.warn("DB write failed:", dbErr.message);
    }

    window.location.href = "user.html";
  } catch (err) {
    console.error("Google sign-in error:", err);
    alert("Google sign-in failed: " + err.message);
  }
});

onIf(".btn-sign-up", (ev) => {
  ev.preventDefault();
  window.location.href = "signup.html";
});

/* ---------- SIGNUP (signup.html) ---------- */
const signupContainer = q(".signup-container");
if (signupContainer) {
  const emailInput = q('input[type="email"]', signupContainer);
  const passwordInput = q('input[type="password"]', signupContainer);
  const signupBtn = q("#signupBtn", signupContainer);

  if (signupBtn) {
    signupBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const email = emailInput?.value?.trim() || "";
      const password = passwordInput?.value?.trim() || "";

      if (!email || !password) {
        alert("⚠️ Please fill in both email and password.");
        return;
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        alert(`✅ Account created: ${cred.user.email}`);
        // Optional: store basic profile in DB
        try {
          await set(ref(db, `users/${cred.user.uid}`), {
            email: cred.user.email,
            createdAt: Date.now()
          });
        } catch (dbErr) {
          console.warn("Could not save user to DB:", dbErr.message);
        }
        window.location.href = "user.html";
      } catch (err) {
        console.error("Signup failed:", err);
        alert("Sign up failed: " + err.message);
      }
    });
  }

  // login link inside signup page
  const loginLink = q(".login-link a", signupContainer);
  if (loginLink) loginLink.addEventListener("click", (ev) => { ev.preventDefault(); window.location.href = "login.html"; });
}

/* ---------- LOGIN (login.html) ---------- */
const loginContainer = q(".login-container");
if (loginContainer) {
  const emailInput = q('input[type="email"]', loginContainer);
  const passwordInput = q('input[type="password"]', loginContainer);
  const loginBtn = q("#loginBtn", loginContainer);

  if (loginBtn) {
    loginBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const email = emailInput?.value?.trim() || "";
      const password = passwordInput?.value?.trim() || "";

      if (!email || !password) {
        alert("⚠️ Enter both email and password.");
        return;
      }

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        alert(`✅ Login successful: ${cred.user.email}`);
        window.location.href = "user.html";
      } catch (err) {
        console.error("Login failed:", err);
        alert("Login failed: " + err.message);
      }
    });
  }

  // signup link inside login page
  const signupLink = q(".signup-link a", loginContainer);
  if (signupLink) signupLink.addEventListener("click", (ev) => { ev.preventDefault(); window.location.href = "signup.html"; });
}

/* ---------- COMMON: logout (any page) ---------- */
const logoutEls = document.querySelectorAll(".logout-btn, #Logout-btn, #logoutBtn, #logout-btn");
if (logoutEls.length) {
  logoutEls.forEach(btn => btn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    try {
      await signOut(auth);
      alert("Logged out");
      window.location.href = "index.html"; // change landing if you want
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed: " + err.message);
    }
  }));
}

/* ---------- startup debug ---------- */
console.log("auth.js loaded — currentUser:", auth.currentUser ? auth.currentUser.email : "none");

/*  --- UI: Continue button / save username --- */
// DOM Elements (guarding presence)
const continueBtn = document.getElementById("saveBtn");
const logoutBtn = document.getElementById("logoutBtn");

// IMPORTANT: unify the localStorage key used by signup and chat
const CLICKUP_USERNAME_KEY = 'username'; // <-- keep this consistent with what you save in signup

// ✅ Continue Button → Go to chat.html
if (continueBtn) {
  continueBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const username = (document.getElementById("username")?.value || "").trim();

    if (!username) {
      alert("⚠️ Please enter a username before continuing!");
      return;
    }

    // Save username using the SAME key chat expects
    localStorage.setItem(CLICKUP_USERNAME_KEY, username);

    alert(`✅ Welcome ${username}! Redirecting to chat...`);
    window.location.href = "chat.html";
  });
}

// ✅ Logout Button → Redirect to signup.html
if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      alert("👋 You have been logged out!");
      window.location.href = "signup.html";
    } catch (error) {
      alert("❌ Logout failed: " + error.message);
    }
  });
}

/* ---------- Auth state guard (optional) ---------- */
onAuthStateChanged(auth, (user) => {
  // If your flow requires logged-in users on some pages, handle redirects here.
  // Example: if (location.pathname.endsWith('user.html') && !user) window.location.href = 'signup.html';
  // For now, we won't force redirect globally to avoid breaking pages without auth.
  console.log("onAuthStateChanged:", user ? user.email : "no user");
});
 // chat app
(() => {
  // --- Utilities ---
  const $ = (sel) => document.querySelector(sel);

  // get username from localStorage or fallback
  function getUsername() {
    const raw = localStorage.getItem('username') || localStorage.getItem('user') || '';
    return raw.trim() || 'User';
  }

  // get first letter for avatar
  function avatarLetter(name) {
    return (name && name[0]) ? name[0].toUpperCase() : 'U';
  }

  // format date/time string
  function formatTimestamp(date = new Date()) {
    const optsDate = { year: 'numeric', month: 'short', day: 'numeric' };
    const optsTime = { hour: '2-digit', minute: '2-digit', hour12: false };
    return `${date.toLocaleDateString(undefined, optsDate)} ${date.toLocaleTimeString(undefined, optsTime)}`;
  }

  // sanitize text to avoid HTML injection when inserting into innerHTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // unique id generator for message elements
  function uid() {
    return 'm_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }

  // --- Elements ---
  const messageInput = $('#message');
  const sendBtn = $('#sendBtn');
  const messageBox = $('#messageBox');
  const logoutBtn = $('#logout');
  const themeToggle = $('#themeToggle');
  const currentUserEl = $('#currentUser');

  // increase icon size a bit if an <img> exists inside sendBtn
  (function adjustSendIcon() {
    if (!sendBtn) return;
    const img = sendBtn.querySelector('img');
    if (img) img.style.height = '18px';
  })();

  // show current username in composer
  if (currentUserEl) {
    currentUserEl.textContent = `You: ${getUsername()}`;
  }

  // ---------- Storage helpers (single copy) ----------
  const STORAGE_KEY = 'chat_messages';
  function saveMessageToStorage(message) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.push(message);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function loadMessagesFromStorage() {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr.forEach(m => appendMessage(m, false));
  }
  function updateMessageInStorage(id, newText, newTime) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = arr.findIndex(x => x.id === id);
    if (idx > -1) {
      arr[idx].text = newText;
      if (newTime) arr[idx].time = newTime;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    }
  }
  function removeMessageFromStorage(id) {
    let arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    arr = arr.filter(x => x.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function clearMessagesFromStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }
function createMessageElement({ id, text, username, time }) {
  const isMine = username === getUsername();

  const wrapper = document.createElement('div');
  wrapper.className = 'message ' + (isMine ? 'mine' : 'theirs');
  wrapper.dataset.id = id;

  wrapper.innerHTML = `
    <div class="avatar">${escapeHtml(avatarLetter(username))}</div>
    <div class="bubble-wrap">
      <div class="bubble-header">
        <span class="bubble-username">${escapeHtml(username)}</span>
        <span class="bubble-time">${escapeHtml(formatTimestamp(new Date(time)))}</span>
      </div>
      <div class="bubble-text" contenteditable="false" role="textbox" aria-label="Message text">${escapeHtml(text)}</div>
      <div class="bubble-actions">
        ${isMine ? `
          <button class="edit-btn" title="Edit">Edit</button>
          <button class="save-btn" title="Save" style="display:none">Save</button>
          <button class="cancel-btn" title="Cancel" style="display:none">Cancel</button>
        ` : ''}
        ${isMine ? `<button class="delete-btn" title="Delete">Delete</button>` : ''}
      </div>
    </div>
  `;
  return wrapper;
}

function appendMessage(data, scrollIntoView = true) {
  const el = createMessageElement(data);
  messageBox.appendChild(el);
  if (scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

  // Send message handler (NOW saves to storage)
  function sendMessage() {
    const raw = messageInput.value || '';
    const text = raw.trim();
    if (!text) return;

    const username = getUsername();
    const message = {
      id: uid(),
      text,
      username,
      time: Date.now()
    };

    appendMessage(message);
    // <-- important: save to storage here
    saveMessageToStorage(message);

    messageInput.value = '';
    messageInput.focus();
  }

  // Delegated click handling for edit/save/cancel/delete
  messageBox.addEventListener('click', (e) => {
    const target = e.target;
    const messageEl = target.closest('.message');
    if (!messageEl) return;
    const id = messageEl.dataset.id;
    const bubbleText = messageEl.querySelector('.bubble-text');
    const editBtn = messageEl.querySelector('.edit-btn');
    const saveBtn = messageEl.querySelector('.save-btn');
    const cancelBtn = messageEl.querySelector('.cancel-btn');
    const deleteBtn = messageEl.querySelector('.delete-btn');

    if (target.matches('.edit-btn')) {
      // only allow editing if this message belongs to current user
      const username = messageEl.querySelector('.bubble-username').textContent;
      if (username !== getUsername()) {
        alert('You can only edit your own messages.');
        return;
      }
      // enter edit mode
      bubbleText.contentEditable = 'true';
      bubbleText.focus();
      // show/hide correct buttons
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'inline-block';
      placeCaretAtEnd(bubbleText);
      // store original text so cancel can restore it
      messageEl.dataset.originalText = bubbleText.textContent;
    } else if (target.matches('.save-btn')) {
      // save edits
      bubbleText.contentEditable = 'false';
      const newText = bubbleText.textContent.trim();
      if (newText === '') {
        alert('Message cannot be empty.');
        bubbleText.focus();
        return;
      }
      // update time to edited time
      const newTime = Date.now();
      const timeEl = messageEl.querySelector('.bubble-time');
      timeEl.textContent = formatTimestamp(new Date(newTime));
      // restore buttons
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      // update storage
      updateMessageInStorage(id, newText, newTime);
      delete messageEl.dataset.originalText;
    } else if (target.matches('.cancel-btn')) {
      // cancel edits — revert to previously saved content
      bubbleText.contentEditable = 'false';
      const original = messageEl.dataset.originalText;
      if (typeof original !== 'undefined') bubbleText.textContent = original;
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      delete messageEl.dataset.originalText;
    } else if (target.matches('.delete-btn')) {
      // allow deleting only your own messages
      const username = messageEl.querySelector('.bubble-username').textContent;
      if (username !== getUsername()) {
        alert('You can only delete your own messages.');
        return;
      }
      if (confirm('Delete this message?')) {
        messageEl.remove();
        removeMessageFromStorage(id);
      }
    }
  });

  // Place caret at end of a contenteditable element
  function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  // Handle key events inside contenteditable bubble-text
  messageBox.addEventListener('keydown', (e) => {
    const target = e.target;
    if (!target.classList || !target.classList.contains('bubble-text')) return;

    // Save on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const msgEl = target.closest('.message');
      const saveBtn = msgEl.querySelector('.save-btn');
      if (saveBtn) saveBtn.click();
    }

    // Cancel edit on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      const msgEl = target.closest('.message');
      const cancelBtn = msgEl.querySelector('.cancel-btn');
      if (cancelBtn) cancelBtn.click();
    }
  });

  // Send on sendBtn click
  if (sendBtn) sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
  });

  // Send on Enter in input field
  if (messageInput) messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Logout behavior: popup + redirect to index.html
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // If you want to clear stored messages on logout, uncomment the next line:
      // clearMessagesFromStorage();
      alert('You have been logged out.');
      window.location.href = 'index.html';
    });
  }

  // Load saved messages on start
  window.addEventListener('load', () => {
    // show username in composer again (in case username was set later)
    if (currentUserEl) currentUserEl.textContent = `You: ${getUsername()}`;
    loadMessagesFromStorage();
    if (messageInput) messageInput.focus();
  });

  // Optional theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark-mode');
      themeToggle.textContent = document.documentElement.classList.contains('dark-mode') ? '🌙' : '🌞';
    });
  }

})
  ();
