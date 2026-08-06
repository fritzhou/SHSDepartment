/* ===========================================================
   dashboard.js
   Teacher dashboard: loads the logged-in teacher's own record,
   lets them edit it, and upload a new profile photo to the
   "faculty-images" storage bucket.
=========================================================== */

let dashSession = null;
let dashTeacher = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("dash-root")) return;

  dashSession = await requireAuth();
  if (!dashSession) return;

  await loadOwnProfile();

  const form = document.getElementById("profile-form");
  if (form) form.addEventListener("submit", saveProfile);

  const photoInput = document.getElementById("photo-input");
  if (photoInput) photoInput.addEventListener("change", uploadPhoto);

  // Logout button is wired automatically by auth.js via the [data-logout] attribute.
});

/* ---------- Load the teacher's own record ---------- */
async function loadOwnProfile() {
  const { data, error } = await supabaseClient
    .from("teachers")
    .select("*")
    .eq("user_id", dashSession.user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) {
    // No teacher row yet for this authenticated user — create a blank one.
    const { data: created, error: createErr } = await supabaseClient
      .from("teachers")
      .insert({ user_id: dashSession.user.id, full_name: dashSession.user.email, email: dashSession.user.email })
      .select()
      .single();
    if (createErr) {
      console.error(createErr);
      return;
    }
    dashTeacher = created;
  } else {
    dashTeacher = data;
  }

  populateDashboard(dashTeacher);
}

function populateDashboard(t) {
  document.getElementById("welcome-name").textContent = t.full_name || dashSession.user.email;
  document.getElementById("welcome-email").textContent = dashSession.user.email;

  document.getElementById("profile-photo-img").src = t.photo_url || defaultAvatar();
  document.getElementById("sidebar-name").textContent = t.full_name || "Add your name";
  document.getElementById("sidebar-position").textContent = t.position || "Position not set";

  document.getElementById("stat-subject").textContent = t.subject || "—";
  document.getElementById("stat-advisory").textContent = t.advisory_class || "—";
  document.getElementById("stat-phone").textContent = t.phone || "—";

  document.getElementById("full_name").value = t.full_name || "";
  document.getElementById("position").value = t.position || "";
  document.getElementById("subject").value = t.subject || "";
  document.getElementById("advisory_class").value = t.advisory_class || "";
  document.getElementById("email").value = t.email || "";
  document.getElementById("phone").value = t.phone || "";
  document.getElementById("bio").value = t.bio || "";
}

/* ---------- Save profile edits ---------- */
async function saveProfile(e) {
  e.preventDefault();
  const btn = document.getElementById("save-btn");
  const msg = document.getElementById("profile-msg");
  setButtonLoading(btn, true, "Saving…");

  const updates = {
    full_name: document.getElementById("full_name").value.trim(),
    position: document.getElementById("position").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    advisory_class: document.getElementById("advisory_class").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    bio: document.getElementById("bio").value.trim(),
  };

  const { data, error } = await supabaseClient
    .from("teachers")
    .update(updates)
    .eq("user_id", dashSession.user.id)
    .select()
    .single();

  setButtonLoading(btn, false, "Save Changes");

  if (error) {
    setMsg(msg, "Something went wrong while saving. Please try again.", true);
    console.error(error);
    return;
  }

  dashTeacher = data;
  populateDashboard(dashTeacher);
  setMsg(msg, "Profile updated successfully.", false);
}

/* ---------- Upload a new profile photo ---------- */
async function uploadPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;

  const msg = document.getElementById("profile-msg");
  const imgEl = document.getElementById("profile-photo-img");
  const ext = file.name.split(".").pop();
  const path = `${dashSession.user.id}/profile.${ext}`;

  setMsg(msg, "Uploading photo…", false);

  const { error: uploadError } = await supabaseClient.storage
    .from(FACULTY_BUCKET)
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) {
    setMsg(msg, "Photo upload failed. Please try a smaller image.", true);
    console.error(uploadError);
    return;
  }

  const { data: urlData } = supabaseClient.storage.from(FACULTY_BUCKET).getPublicUrl(path);
  const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabaseClient
    .from("teachers")
    .update({ photo_url: photoUrl })
    .eq("user_id", dashSession.user.id)
    .select()
    .single();

  if (error) {
    setMsg(msg, "Photo uploaded, but profile update failed.", true);
    console.error(error);
    return;
  }

  dashTeacher = data;
  imgEl.src = photoUrl;
  setMsg(msg, "Profile photo updated.", false);
}

function defaultAvatar() {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" fill="#FCE7EF"/>
      <circle cx="100" cy="78" r="34" fill="#EC1E63" opacity="0.35"/>
      <ellipse cx="100" cy="170" rx="58" ry="46" fill="#EC1E63" opacity="0.35"/>
    </svg>`);
}
