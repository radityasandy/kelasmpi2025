// ==============================
// KONFIGURASI USER LOGIN
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

// ==============================
// CEK LOGIN
// ==============================
function isLoggedIn() {
  return localStorage.getItem("loggedIn") === "true";
}
function getUserEmail() {
  return localStorage.getItem("userEmail");
}
function getUserRole() {
  return localStorage.getItem("userRole");
}
function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  window.location.href = "login.html";
}

// ==============================
// LOGIN VALIDASI
// ==============================
function validateLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (users[email] && users[email].password === password) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", users[email].role);
    alert("Login berhasil!");
    window.location.href = "index.html";
  } else {
    alert("Email atau password salah!");
  }
}

// ==============================
// NAVBAR LOGIN STATUS
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const userInfo = document.querySelector("#user-info");
  const loginBtn = document.querySelector("#login-btn");
  const logoutBtn = document.querySelector("#logout-btn");

  if (isLoggedIn()) {
    const email = getUserEmail();
    const role = getUserRole();

    if (userInfo) {
      userInfo.style.display = "inline-block";
      userInfo.textContent = `👤 ${email} (${role})`;
    }

    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
      logoutBtn.addEventListener("click", logout);
    }

  } else {
    if (userInfo) userInfo.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
  }
});

// ==============================
// STATUS LOGIN + NAVBAR
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const userInfo = document.getElementById("user-info");
  const loginDesktop = document.getElementById("login-btn-desktop");
  const logoutDesktop = document.getElementById("logout-btn-desktop");
  const loginMobile = document.getElementById("login-btn-mobile");
  const logoutMobile = document.getElementById("logout-btn-mobile");
  const uploadSection = document.querySelector(".upload-section");

  const page = window.location.pathname.split("/").pop();

  if (isLoggedIn()) {
    const email = getUserEmail();
    const role = getUserRole();

    if (userInfo) userInfo.textContent = `👤 ${email} (${role})`;
    if (loginDesktop) loginDesktop.style.display = "none";
    if (logoutDesktop) logoutDesktop.style.display = "inline-block";
    if (loginMobile) loginMobile.style.display = "none";
    if (logoutMobile) logoutMobile.style.display = "inline-block";

    if (page === "makalah.html") {
      if (email === "mpiuser@gmail.com" || email === "mpiadmin@gmail.com") {
        loadMakalahTable();
      } else {
        alert("Anda tidak memiliki akses ke halaman ini!");
        window.location.href = "login.html";
      }
    }

    if (uploadSection && role !== "admin") {
      uploadSection.style.display = "none";
    }
  } else {
    if (page !== "login.html") {
      window.location.href = "login.html";
    }

    if (userInfo) userInfo.textContent = "";
    if (loginDesktop) loginDesktop.style.display = "inline-block";
    if (logoutDesktop) logoutDesktop.style.display = "none";
    if (loginMobile) loginMobile.style.display = "inline-block";
    if (logoutMobile) logoutMobile.style.display = "none";
  }

  if (logoutDesktop) logoutDesktop.addEventListener("click", logout);
  if (logoutMobile) logoutMobile.addEventListener("click", logout);
});

// ==============================
// KONFIGURASI SUPABASE
// ==============================
const SUPABASE_URL = "https://gufbusvnoscociobvxxn.supabase.co"; // 🔁 Ganti dengan URL proyekmu
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1ZmJ1c3Zub3Njb2Npb2J2eHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTQ3ODUsImV4cCI6MjA3Njk3MDc4NX0.m5ulKD5UlAE3AZ_hizYJQuK1gQD2QOAg9njTHeqwGco"; // 🔁 Ganti dengan anon key Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// LOAD DATA MAKALAH (SEMUA USER)
// ==============================
async function loadMakalahTable() {
  const tableBody = document.getElementById("makalahTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "<tr><td colspan='4'>Memuat data...</td></tr>";

  const { data: files, error } = await supabase.storage.from("makalah").list("makalah");

  if (error) {
    tableBody.innerHTML = `<tr><td colspan='4'>Gagal memuat data makalah!</td></tr>`;
    console.error(error);
    return;
  }

  tableBody.innerHTML = "";
  const role = getUserRole();

  files.forEach((file) => {
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/makalah/${file.name}`;
    const row = document.createElement("tr");

    let actionButtons = `
      <button class="lihat-btn" onclick="window.open('${fileUrl}', '_blank')">Lihat</button>
      <a href="${fileUrl}" download class="download-btn">Download</a>
    `;

    if (role === "admin") {
      actionButtons += `
        <button class="hapus-btn" onclick="hapusMakalah('${file.name}')">Hapus</button>
      `;
    }

    row.innerHTML = `
      <td>${file.name}</td>
      <td>${new Date(file.created_at || Date.now()).toLocaleDateString()}</td>
      <td>${file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) + " MB" : "-"}</td>
      <td>${actionButtons}</td>
    `;

    tableBody.appendChild(row);
  });
}

// ==============================
// HAPUS MAKALAH (ADMIN ONLY)
// ==============================
async function hapusMakalah(fileName) {
  const role = getUserRole();
  if (role !== "admin") {
    alert("❌ Anda tidak memiliki izin untuk menghapus!");
    return;
  }

  if (confirm("Yakin ingin menghapus file ini?")) {
    const { error } = await supabase.storage.from("makalah").remove([`makalah/${fileName}`]);
    if (error) {
      alert("❌ Gagal menghapus file!");
      console.error(error);
      return;
    }
    alert("✅ File berhasil dihapus!");
    loadMakalahTable();
  }
}











// ==============================
// AUTO LOGOUT 20 MENIT
// ==============================
let waktuKunjungan = 20 * 60; 

function mulaiTimerKunjungan() {
  const hitungMundur = setInterval(() => {
    waktuKunjungan--;
    if (waktuKunjungan <= 0) {
      clearInterval(hitungMundur);
      alert("Waktu kunjungan Anda (20 menit) telah berakhir. Anda akan logout otomatis.");
      logout();
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", function () {
  if (isLoggedIn()) {
    mulaiTimerKunjungan();

    // reset timer jika ada aktivitas
    ["mousemove","keydown","click","scroll"].forEach(evt => {
      document.addEventListener(evt, () => waktuKunjungan = 20*60);
    });
  }
});

// ==============================
// MOBILE NAV TOGGLE
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      mobileNav.classList.toggle("active");
    });
  }
});



