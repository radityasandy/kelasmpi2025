import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB5TYq_-QWQiBQ-9wQn6pOHefsNQTyg3UY",
  authDomain: "kelasmpib2025.firebaseapp.com",
  projectId: "kelasmpib2025",
  storageBucket: "kelasmpib2025.appspot.com",
  messagingSenderId: "15991419195",
  appId: "1:15991419195:web:9baa88dc76b37b3ada871e",
  measurementId: "G-59EN8SJ1J1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const collectionName = `makalah_${MATKUL}`; // <-- terpisah per matkul

function getUserRole() { return localStorage.getItem("userRole") || "user"; }
function getUserEmail() { return localStorage.getItem("userEmail") || ""; }

const form = document.getElementById("makalahForm");
const submitBtn = document.getElementById("submitBtn");
const updateBtn = document.getElementById("updateBtn");
let editDocId = null;

// ==============================
// Submit Form (Upload / Add)
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = getUserRole();
    const email = getUserEmail();
    if (role !== "admin" || email !== "mpiadmin@gmail.com") return alert("❌ Hanya admin!");

    const judul = document.getElementById("judul").value.trim();
    const kelompok = document.getElementById("kelompok").value.trim();
    const tanggal = document.getElementById("tanggal").value;
    const pertemuan = document.getElementById("pertemuan").value;
    const file = document.getElementById("file").files[0];

    if (!judul || !kelompok || !tanggal || !pertemuan) return alert("Lengkapi semua data!");
    if (!file && !editDocId) return alert("Pilih file!");

    let fileUrl = null;
    if (file) {
      const storageRef = ref(storage, `${MATKUL}/${Date.now()}_${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      fileUrl = await getDownloadURL(snap.ref);
    }

    try {
      if (editDocId) {
        const docRef = doc(db, collectionName, editDocId);
        const dataUpdate = { judul, kelompok, tanggal, pertemuan };
        if (fileUrl) dataUpdate.fileUrl = fileUrl;
        await updateDoc(docRef, dataUpdate);
        alert("✅ Makalah diperbarui!");
        editDocId = null;
        updateBtn.style.display = "none";
        submitBtn.style.display = "inline-block";
      } else {
        await addDoc(collection(db, collectionName), { judul, kelompok, tanggal, pertemuan, fileUrl });
        alert("✅ Makalah baru ditambahkan!");
      }
      form.reset();
      loadTable();
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menyimpan makalah!");
    }
  });
}

// ==============================
// Load Table
async function loadTable() {
  const tbody = document.querySelector("#makalahTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "<tr><td colspan='6'>Memuat data...</td></tr>";

  const snapshot = await getDocs(collection(db, collectionName));
  const role = getUserRole();
  const email = getUserEmail();

  tbody.innerHTML = "";
  if (snapshot.empty) {
    tbody.innerHTML = "<tr><td colspan='6'>Belum ada makalah.</td></tr>";
    return;
  }

  snapshot.forEach(docItem => {
    const data = docItem.data();
    const tr = document.createElement("tr");

    let aksi = `<button class="lihat-btn">Lihat</button>`;
    if (data.fileUrl) aksi += `<button class="download-btn">Download</button>`;
    if (role === "admin" && email === "mpiadmin@gmail.com") aksi += `<button class="edit-btn">Edit</button><button class="delete-btn">Hapus</button>`;

    tr.innerHTML = `
      <td>${data.judul}</td>
      <td>${data.kelompok}</td>
      <td>${data.tanggal}</td>
      <td>${data.pertemuan}</td>
      <td>${data.fileUrl ? data.fileUrl.split('/').pop() : "-"}</td>
      <td>${aksi}</td>
    `;

    tr.querySelector(".lihat-btn").addEventListener("click", () => {
      window.location.href = `lihat.html?id=${docItem.id}&matkul=${MATKUL}`;
    });

    if (tr.querySelector(".download-btn")) {
      tr.querySelector(".download-btn").addEventListener("click", () => window.open(data.fileUrl, "_blank"));
    }

    if (tr.querySelector(".edit-btn")) {
      tr.querySelector(".edit-btn").addEventListener("click", () => {
        document.getElementById("judul").value = data.judul;
        document.getElementById("kelompok").value = data.kelompok;
        document.getElementById("tanggal").value = data.tanggal;
        document.getElementById("pertemuan").value = data.pertemuan;
        editDocId = docItem.id;
        submitBtn.style.display = "none";
        updateBtn.style.display = "inline-block";
      });
    }

    if (tr.querySelector(".delete-btn")) {
      tr.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm("Yakin ingin menghapus makalah?")) {
          await deleteDoc(doc(db, collectionName, docItem.id));
          alert("🗑️ Makalah dihapus!");
          loadTable();
        }
      });
    }

    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", loadTable);
