/* ===========================================================
   auth.js
   Handles login, logout, session state, nav "Login/Dashboard"
   button, and page guards for dashboard.html / admin.html.
=========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const logoutBtns = document.querySelectorAll("[data-logout]");
  logoutBtns.forEach((btn) => btn.addEventListener("click", handleLogout));
});

/* ---------- Check admin status ---------- */
async function checkIsAdmin(userId) {
  if (!userId) return false;
  const { data, error } = await supabaseClient
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/* ---------- Login ---------- */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const msg = document.getElementById("login-msg");
  const btn = document.getElementById("login-submit");

  setMsg(msg, "", false);
  setButtonLoading(btn, true, "Signing in…");

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setButtonLoading(btn, false, "Sign In");
    setMsg(msg, error.message || "Unable to sign in. Please check your credentials.", true);
    return;
  }

  const isAdmin = await checkIsAdmin(data.user.id);
  window.location.href = isAdmin ? "admin.html" : "dashboard.html";
}

/* ---------- Logout ---------- */
async function handleLogout(e) {
  e.preventDefault();
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

/* ---------- Guard: require any logged-in teacher (dashboard.html) ---------- */
async function requireAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return null;
  }
  return data.session;
}

/* ---------- Guard: require an administrator (admin.html) ---------- */
async function requireAdmin() {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return null;
  }
  const isAdmin = await checkIsAdmin(data.session.user.id);
  if (!isAdmin) {
    showAccessDenied();
    return null;
  }
  return data.session;
}

function showAccessDenied() {
  const main = document.getElementById("admin-main") || document.querySelector("main");
  if (main) {
    main.innerHTML = `
      <div class="guard-screen">
        <div>
          <div class="icon-box" style="margin:0 auto 20px;">&#128274;</div>
          <h2>Administrator access required</h2>
          <p>This page is restricted to Senior High School Department administrators.</p>
          <a class="btn btn-primary" href="dashboard.html">Go to my dashboard</a>
        </div>
      </div>`;
  }
}

/* ---------- Small UI helpers shared by auth-related forms ---------- */
function setMsg(el, text, isError) {
  if (!el) return;
  el.textContent = text;
  el.classList.remove("success", "error", "show");
  if (!text) return;
  el.classList.add("show", isError ? "error" : "success");
}

function setButtonLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? `<span class="spinner"></span> ${label}` : label;
}
