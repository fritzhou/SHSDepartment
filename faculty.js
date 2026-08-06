/* ===========================================================
   faculty.js
   Loads teachers from Supabase and renders the faculty grid
   on faculty.html. Shows an "Edit Profile" button only on the
   card belonging to the currently logged-in teacher.
=========================================================== */

let allTeachers = [];
let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("faculty-grid");
  if (!grid) return;

  initFacultyPage();

  const search = document.getElementById("faculty-search");
  if (search) search.addEventListener("input", () => renderFaculty(filterTeachers(search.value)));
});

async function initFacultyPage() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  currentUserId = sessionData.session ? sessionData.session.user.id : null;

  await loadFaculty();
}

async function loadFaculty() {
  const grid = document.getElementById("faculty-grid");
  grid.innerHTML = Array(6).fill('<div class="skeleton"></div>').join("");

  const { data, error } = await supabaseClient
    .from("teachers")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    grid.innerHTML = `<div class="empty-state"><p>We couldn't load the faculty list right now. Please try again later.</p></div>`;
    console.error(error);
    return;
  }

  allTeachers = data || [];
  renderFaculty(allTeachers);
}

function filterTeachers(query) {
  const q = query.trim().toLowerCase();
  if (!q) return allTeachers;
  return allTeachers.filter((t) =>
    [t.full_name, t.position, t.subject, t.advisory_class]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

function renderFaculty(list) {
  const grid = document.getElementById("faculty-grid");

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon-box" style="margin:0 auto 18px;">&#128269;</div>
        <p>No faculty members match your search.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(renderCard).join("");
}

function renderCard(t) {
  const photo = t.photo_url || defaultAvatar();
  const isOwner = currentUserId && t.user_id === currentUserId;

  return `
    <article class="faculty-card reveal in">
      <div class="faculty-photo-wrap">
        <img class="faculty-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(t.full_name)}" loading="lazy" onerror="this.src='${defaultAvatar()}'">
      </div>
      <div class="faculty-body">
        <h3>${escapeHtml(t.full_name || "Unnamed Faculty")}</h3>
        <div class="faculty-position">${escapeHtml(t.position || "Faculty Member")}</div>
        <ul class="faculty-meta">
          ${t.subject ? `<li><span class="tag-label">Subject:</span><span>${escapeHtml(t.subject)}</span></li>` : ""}
          ${t.advisory_class ? `<li><span class="tag-label">Advisory:</span><span>${escapeHtml(t.advisory_class)}</span></li>` : ""}
          ${t.email ? `<li><span class="tag-label">Email:</span><span>${escapeHtml(t.email)}</span></li>` : ""}
        </ul>
        ${t.bio ? `<p class="faculty-bio">${escapeHtml(truncate(t.bio, 130))}</p>` : ""}
        ${isOwner ? `<div class="faculty-card-actions"><a class="btn btn-outline btn-sm" href="dashboard.html">Edit Profile</a></div>` : ""}
      </div>
    </article>`;
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n).trim() + "…" : str;
}

function defaultAvatar() {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" fill="#FCE7EF"/>
      <circle cx="100" cy="78" r="34" fill="#EC1E63" opacity="0.35"/>
      <ellipse cx="100" cy="170" rx="58" ry="46" fill="#EC1E63" opacity="0.35"/>
    </svg>`);
}
