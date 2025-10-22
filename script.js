// ==============================
// KONFIGURASI USER LOGIN
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

// ==============================
// FIREBASE INIT
// ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5TYq_-QWQiBQ-9wQn6pOHefsNQTyg3UY",
  authDomain: "kelasmpib2025.firebaseapp.com",
  projectId: "kelasmpib2025",
  storageBucket: "kelasmpib2025.appspot.com", // pastikan ini
  messagingSenderId: "15991419195",
  appId: "1:15991419195:web:9baa88dc76b37b3ada871e",
  measurementId: "G-59EN8SJ1J1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ==============================
// FUNGSI LOGIN & LOGOUT
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
// VALIDASI LOGIN
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
// LOAD DATA MAKALAH (Firestore)
// ==============================
async function loadMakalahTable() {
  const tableBody = document.getElementById("makalahTableBody");
  tableBody.innerHTML = "";
  const role = getUserRole();

  const querySnapshot = await getDocs(collection(db, "makalah"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const row = document.createElement("tr");

    let actionButtons = `
      <button class="lihat-btn" onclick="lihatMakalah('${id}')">Lihat</button>
      <button class="download-btn" onclick="downloadMakalah('${id}')">Download</button>
    `;
    if (role === "admin") {
      actionButtons += `
        <button class="edit-btn" onclick="editMakalah('${id}')">Edit</button>
        <button class="hapus-btn" onclick="hapusMakalah('${id}')">Hapus</button>
      `;
    }

    row.innerHTML = `
      <td>${data.judul}</td>
      <td>${data.kelompok}</td>
      <td>${data.tanggal || "-"}</td>
      <td>${actionButtons}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ==============================
// FUNGSI EDIT & HAPUS (ADMIN ONLY)
// ==============================
function editMakalah(id) {
  if (getUserRole() !== "admin") {
    alert("❌ Anda tidak memiliki izin untuk mengedit makalah!");
    return;
  }
  window.location.href = `edit.html?id=${id}`;
}

async function hapusMakalah(id) {
  if (getUserRole() !== "admin" || getUserEmail() !== "mpiadmin@gmail.com") {
    alert("❌ Anda tidak memiliki izin untuk menghapus makalah!");
    return;
  }

  if (confirm("Yakin ingin menghapus makalah ini?")) {
    const docRef = doc(db, "makalah", id);
    const docSnap = await docRef.get();
    // hapus file storage jika ada
    try { await deleteObject(storageRef(storage, id)); } catch(e){}

    await deleteDoc(docRef);
    alert("✅ Makalah berhasil dihapus!");
    loadMakalahTable();
  }
}

// ==============================
// FUNGSI UPLOAD (ADMIN ONLY, max 100MB)
// ==============================
async function uploadMakalah(judul, kelompok, tanggal, fileInputId) {
  if (getUserRole() !== "admin" || getUserEmail() !== "mpiadmin@gmail.com") {
    alert("❌ Hanya admin yang dapat mengupload makalah!");
    return;
  }

  const fileInput = document.getElementById(fileInputId);
  if (!fileInput || fileInput.files.length === 0) return alert("Pilih file!");
  const file = fileInput.files[0];
  if (file.size > 100*1024*1024) return alert("❌ File maksimal 100MB");

  const path = `makalah/${Date.now()}_${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const fileUrl = await getDownloadURL(ref);

  await addDoc(collection(db, "makalah"), {
    judul, kelompok, tanggal, fileUrl, storagePath: path
  });

  alert("✅ Makalah berhasil diupload!");
  fileInput.value = "";
  loadMakalahTable();
}

// ==============================
// DOWNLOAD & LIHAT
// ==============================
async function downloadMakalah(id) {
  const docSnap = await getDocs(doc(db, "makalah", id));
  const data = docSnap.data();
  if (!data || !data.fileUrl) return alert("File tidak tersedia");
  window.open(data.fileUrl, "_blank");
}

function lihatMakalah(id) {
  window.location.href = `lihat.html?id=${id}`;
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



