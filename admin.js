/* ===========================================================
   admin.js
   Administrator dashboard: full faculty CRUD, search, password
   reset emails, and photo uploads on behalf of any teacher.

   Note: creating a brand-new Supabase Auth login for a teacher
   requires the service-role key, which must never be exposed in
   client-side code. "Add Teacher" therefore creates the faculty
   record; it becomes linked to a login automatically the first
   time that person signs up / signs in with the same email
   (or an admin can create the Auth user from the Supabase
   dashboard and it will link via the email match on first login).
=========================================================== */

let adminSession = null;
let allAdminTeachers = [];
let editingTeacherId = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("admin-root")) return;

  adminSession = await requireAdmin();
  if (!adminSession) return;

  await loadAllTeachers();

  document.getElementById("admin-welcome").textContent = adminSession.user.email;

  document.getElementById("add-teacher-btn").addEventListener("click", () => openTeacherModal(null));
  document.getElementById("teacher-form").addEventListener("submit", saveTeacher);
  document.getElementById("modal-close").addEventListener("click", closeTeacherModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeTeacherModal();
  });

  const search = document.getElementById("admin-search");
  if (search) search.addEventListener("input", () => renderAdminTable(filterAdminTeachers(search.value)));

  const photoInput = document.getElementById("modal-photo-input");
  if (photoInput) photoInput.addEventListener("change", handleModalPhotoUpload);
});

/* ---------- Load all teachers ---------- */
async function loadAllTeachers() {
  const tbody = document.getElementById("admin-tbody");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;"><span class="spinner dark"></span></td></tr>`;

  const { data, error } = await supabaseClient
    .from("teachers")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6">Failed to load faculty records.</td></tr>`;
    console.error(error);
    return;
  }

  allAdminTeachers = data || [];
  document.getElementById("admin-count").textContent = allAdminTeachers.length;
  renderAdminTable(allAdminTeachers);
}

function filterAdminTeachers(query) {
  const q = query.trim().toLowerCase();
  if (!q) return allAdminTeachers;
  return allAdminTeachers.filter((t) =>
    [t.full_name, t.position, t.subject, t.advisory_class, t.email]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(q))
  );
}

function renderAdminTable(list) {
  const tbody = document.getElementById("admin-tbody");

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;color:var(--gray);">No faculty members found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((t) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px;">
          <img class="table-avatar" src="${escapeHtml(t.photo_url || defaultAvatar())}" alt="">
          <div>
            <div style="font-weight:600;">${escapeHtml(t.full_name || "Unnamed")}</div>
            <div style="color:var(--gray);font-size:0.78rem;">${escapeHtml(t.email || "No email on file")}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(t.position || "—")}</td>
      <td>${escapeHtml(t.subject || "—")}</td>
      <td>${escapeHtml(t.advisory_class || "—")}</td>
      <td>${t.user_id ? `<span class="pill-badge">Linked</span>` : `<span class="pill-badge" style="background:#f4f4f6;color:var(--gray);">Not linked</span>`}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" data-edit="${t.id}">Edit</button>
          ${t.email ? `<button class="btn btn-outline btn-sm" data-reset="${escapeHtml(t.email)}">Reset</button>` : ""}
          <button class="btn btn-danger btn-sm" data-delete="${t.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openTeacherModal(btn.dataset.edit)));
  tbody.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteTeacher(btn.dataset.delete)));
  tbody.querySelectorAll("[data-reset]").forEach((btn) =>
    btn.addEventListener("click", () => resetPassword(btn.dataset.reset)));
}

/* ---------- Add / edit modal ---------- */
function openTeacherModal(teacherId) {
  editingTeacherId = teacherId;
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("teacher-form");
  form.reset();
  document.getElementById("modal-msg").classList.remove("show");

  if (teacherId) {
    const t = allAdminTeachers.find((x) => x.id === teacherId);
    modalTitle.textContent = "Edit Teacher";
    document.getElementById("m_full_name").value = t.full_name || "";
    document.getElementById("m_position").value = t.position || "";
    document.getElementById("m_subject").value = t.subject || "";
    document.getElementById("m_advisory_class").value = t.advisory_class || "";
    document.getElementById("m_email").value = t.email || "";
    document.getElementById("m_phone").value = t.phone || "";
    document.getElementById("m_bio").value = t.bio || "";
    document.getElementById("modal-photo-img").src = t.photo_url || defaultAvatar();
  } else {
    modalTitle.textContent = "Add Teacher";
    document.getElementById("modal-photo-img").src = defaultAvatar();
  }

  document.getElementById("modal-overlay").classList.add("open");
}

function closeTeacherModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  editingTeacherId = null;
}

async function saveTeacher(e) {
  e.preventDefault();
  const btn = document.getElementById("modal-save-btn");
  const msg = document.getElementById("modal-msg");
  setButtonLoading(btn, true, "Saving…");

  const payload = {
    full_name: document.getElementById("m_full_name").value.trim(),
    position: document.getElementById("m_position").value.trim(),
    subject: document.getElementById("m_subject").value.trim(),
    advisory_class: document.getElementById("m_advisory_class").value.trim(),
    email: document.getElementById("m_email").value.trim(),
    phone: document.getElementById("m_phone").value.trim(),
    bio: document.getElementById("m_bio").value.trim(),
  };

  let result;
  if (editingTeacherId) {
    result = await supabaseClient.from("teachers").update(payload).eq("id", editingTeacherId).select().single();
  } else {
    result = await supabaseClient.from("teachers").insert(payload).select().single();
  }

  setButtonLoading(btn, false, "Save Teacher");

  if (result.error) {
    setMsg(msg, "Save failed: " + result.error.message, true);
    console.error(result.error);
    return;
  }

  await loadAllTeachers();
  closeTeacherModal();
}

/* ---------- Delete ---------- */
async function deleteTeacher(id) {
  const t = allAdminTeachers.find((x) => x.id === id);
  const ok = confirm(`Remove ${t ? t.full_name : "this teacher"} from the faculty list? This cannot be undone.`);
  if (!ok) return;

  const { error } = await supabaseClient.from("teachers").delete().eq("id", id);
  if (error) {
    alert("Delete failed: " + error.message);
    console.error(error);
    return;
  }
  await loadAllTeachers();
}

/* ---------- Password reset ---------- */
async function resetPassword(email) {
  const ok = confirm(`Send a password reset email to ${email}?`);
  if (!ok) return;

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login.html",
  });

  if (error) {
    alert("Could not send reset email: " + error.message);
    console.error(error);
    return;
  }
  alert(`Password reset email sent to ${email}.`);
}

/* ---------- Upload photo from within the modal (admin acting on any teacher) ---------- */
async function handleModalPhotoUpload(e) {
  const file = e.target.files[0];
  if (!file || !editingTeacherId) {
    if (!editingTeacherId) alert("Save the teacher first, then reopen Edit to upload a photo.");
    return;
  }

  const t = allAdminTeachers.find((x) => x.id === editingTeacherId);
  const folder = t.user_id || `admin-${t.id}`;
  const ext = file.name.split(".").pop();
  const path = `${folder}/profile.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(FACULTY_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) {
    alert("Photo upload failed: " + uploadError.message);
    console.error(uploadError);
    return;
  }

  const { data: urlData } = supabaseClient.storage.from(FACULTY_BUCKET).getPublicUrl(path);
  const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error } = await supabaseClient.from("teachers").update({ photo_url: photoUrl }).eq("id", editingTeacherId);
  if (error) {
    alert("Photo uploaded, but saving the record failed: " + error.message);
    console.error(error);
    return;
  }

  document.getElementById("modal-photo-img").src = photoUrl;
  await loadAllTeachers();
}

function defaultAvatar() {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" fill="#FCE7EF"/>
      <circle cx="100" cy="78" r="34" fill="#EC1E63" opacity="0.35"/>
      <ellipse cx="100" cy="170" rx="58" ry="46" fill="#EC1E63" opacity="0.35"/>
    </svg>`);
}
