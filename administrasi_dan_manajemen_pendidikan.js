const dbName = "DB_AdministrasiManajemenPendidikan";
let db;
let editIndex = null;

// ==============================
// Inisialisasi DB
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open(dbName, 1);

  request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("makalahData")) {
      db.createObjectStore("makalahData", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = (e) => {
    db = e.target.result;
    loadTable();
    populateFilterOptions();
  };

  request.onerror = (e) => {
    console.error("❌ Gagal membuka DB:", e.target.error);
  };
});

// ==============================
// Ambil Role Login
// ==============================
function getUserRole() {
  return localStorage.getItem("userRole") || "user";
}
function getUserEmail() {
  return localStorage.getItem("userEmail") || "";
}

// ==============================
// Form Submit
// ==============================
const form = document.getElementById("makalahForm");
const submitBtn = document.getElementById("submitBtn");
const updateBtn = document.getElementById("updateBtn");
const cancelBtn = document.getElementById("cancelBtn");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const role = getUserRole();
    const email = getUserEmail();

    if (role !== "admin" || email !== "mpiadmin@gmail.com") {
      alert("❌ Hanya admin yang bisa menambah makalah!");
      return;
    }

    const judul = document.getElementById("judul")?.value.trim();
    const kelompok = document.getElementById("kelompok")?.value.trim();
    const tanggal = document.getElementById("tanggal")?.value;
    const pertemuan = document.getElementById("pertemuan")?.value;
    const file = document.getElementById("file")?.files[0];

    if (!judul || !kelompok || !tanggal || !pertemuan) {
      alert("⚠️ Lengkapi semua data!");
      return;
    }

    if (!file && editIndex === null) {
      alert("⚠️ Pilih file makalah!");
      return;
    }

    const toBase64 = (f) =>
      new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(f);
      });

    let fileData = null;
    if (file) fileData = await toBase64(file);

    const tx = db.transaction("makalahData", "readwrite");
    const store = tx.objectStore("makalahData");

    store.add({
      judul,
      kelompok,
      tanggal,
      pertemuan,
      fileName: file.name,
      fileData,
    });

    alert("✅ Makalah baru berhasil ditambahkan!");
    tx.oncomplete = () => {
      form.reset();
      loadTable();
      populateFilterOptions();
    };
  });
}

// ==============================
// MODE EDIT & UPDATE
// ==============================
function enterEditMode() {
  submitBtn.style.display = "none";
  updateBtn.style.display = "inline-block";
  cancelBtn.style.display = "inline-block";
}

function exitEditMode() {
  submitBtn.style.display = "inline-block";
  updateBtn.style.display = "none";
  cancelBtn.style.display = "none";
  editIndex = null;
  form.reset();
}

// ==============================
// Update Data
// ==============================
updateBtn.addEventListener("click", async () => {
  const role = getUserRole();
  const email = getUserEmail();

  if (role !== "admin" || email !== "mpiadmin@gmail.com") {
    alert("❌ Hanya admin yang bisa mengedit makalah!");
    return;
  }

  if (editIndex === null) return alert("Tidak ada data yang sedang diedit!");

  const judul = document.getElementById("judul").value.trim();
  const kelompok = document.getElementById("kelompok").value.trim();
  const tanggal = document.getElementById("tanggal").value;
  const pertemuan = document.getElementById("pertemuan").value;
  const file = document.getElementById("file").files[0];

  if (!judul || !kelompok || !tanggal || !pertemuan) {
    alert("⚠️ Lengkapi semua data!");
    return;
  }

  const existing = await getById(editIndex);
  if (!existing) return alert("❌ Data tidak ditemukan!");

  const toBase64 = (f) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(f);
    });

  let fileData = existing.fileData;
  let fileName = existing.fileName;
  if (file) {
    fileData = await toBase64(file);
    fileName = file.name;
  }

  const updatedData = {
    id: editIndex,
    judul,
    kelompok,
    tanggal,
    pertemuan,
    fileName,
    fileData,
  };

  const tx = db.transaction("makalahData", "readwrite");
  const store = tx.objectStore("makalahData");
  store.put(updatedData);

  tx.oncomplete = () => {
    alert("✅ Makalah berhasil diperbarui!");
    loadTable();
    populateFilterOptions();
    exitEditMode();
  };
});

cancelBtn.addEventListener("click", () => {
  exitEditMode();
});

// ==============================
// Load Table
// ==============================
async function loadTable() {
  const tbody = document.querySelector("#makalahTable tbody");
  if (!tbody) return;

  const data = await getAll();
  renderTable(data);
}

// ==============================
// Render Table
// ==============================
function renderTable(data) {
  const tbody = document.querySelector("#makalahTable tbody");
  if (!tbody) return;

  const role = getUserRole();
  const email = getUserEmail();

  tbody.innerHTML = "";
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6">Belum ada makalah.</td></tr>`;
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement("tr");

    let tombolAksi = `
      <button class="btn lihat-btn">Lihat</button>
      <button class="btn download-btn">Download</button>
    `;

    if (role === "admin" && email === "mpiadmin@gmail.com") {
      tombolAksi += `
        <button class="btn edit-btn">Edit</button>
        <button class="btn delete-btn">Hapus</button>
      `;
    }

    tr.innerHTML = `
      <td>${item.judul}</td>
      <td>${item.kelompok}</td>
      <td>${item.tanggal}</td>
      <td>${item.pertemuan}</td>
      <td>${item.fileName}</td>
      <td>${tombolAksi}</td>
    `;

    // Tombol Lihat
    tr.querySelector(".lihat-btn").addEventListener("click", () => {
      window.location.href = `lihat.html?id=${item.id}&matkul=administrasi-manajemen-pendidikan`;
    });

    // Tombol Download
    tr.querySelector(".download-btn").addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = item.fileData;
      a.download = item.fileName;
      a.click();
    });

    // Edit hanya admin
    if (role === "admin" && email === "mpiadmin@gmail.com") {
      tr.querySelector(".edit-btn").addEventListener("click", async () => {
        const data = await getById(item.id);
        if (!data) {
          alert("❌ Data tidak ditemukan!");
          return;
        }

        document.getElementById("judul").value = data.judul;
        document.getElementById("kelompok").value = data.kelompok;
        document.getElementById("tanggal").value = data.tanggal;
        document.getElementById("pertemuan").value = data.pertemuan;
        editIndex = data.id;

        enterEditMode();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      tr.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("Yakin ingin menghapus makalah ini?")) deleteById(item.id);
      });
    }

    tbody.appendChild(tr);
  });
}

// ==============================
// Fungsi Hapus (Admin Only)
// ==============================
function deleteById(id) {
  const role = getUserRole();
  const email = getUserEmail();

  if (role !== "admin" || email !== "mpiadmin@gmail.com") {
    alert("❌ Anda tidak punya izin menghapus!");
    return;
  }

  const tx = db.transaction("makalahData", "readwrite");
  const store = tx.objectStore("makalahData");
  store.delete(id);
  tx.oncomplete = () => {
    alert("🗑️ Makalah berhasil dihapus!");
    loadTable();
    populateFilterOptions();
  };
}

// ==============================
// Helper DB
// ==============================
function getAll() {
  return new Promise((res) => {
    const tx = db.transaction("makalahData", "readonly");
    const store = tx.objectStore("makalahData");
    const req = store.getAll();
    req.onsuccess = () => res(req.result);
  });
}

function getById(id) {
  return new Promise((res) => {
    const tx = db.transaction("makalahData", "readonly");
    const store = tx.objectStore("makalahData");
    const req = store.get(id);
    req.onsuccess = () => res(req.result);
  });
}

// ==============================
// Filter & Search
// ==============================
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", async function () {
    const val = this.value.toLowerCase();
    const data = await getAll();
    renderTable(
      data.filter(
        (d) =>
          d.judul.toLowerCase().includes(val) ||
          d.kelompok.toLowerCase().includes(val) ||
          String(d.pertemuan).includes(val)
      )
    );
  });
}

const filterSelect = document.createElement("select");
filterSelect.id = "filterPertemuan";
filterSelect.style.marginLeft = "10px";
filterSelect.innerHTML = '<option value="">Semua Pertemuan</option>';
document.querySelector(".search-filter")?.appendChild(filterSelect);

filterSelect.addEventListener("change", async function () {
  const sel = this.value;
  const data = await getAll();
  renderTable(sel ? data.filter((d) => String(d.pertemuan) === sel) : data);
});

async function populateFilterOptions() {
  const data = await getAll();
  const pertemuanSet = [...new Set(data.map((d) => d.pertemuan))];
  filterSelect.innerHTML = '<option value="">Semua Pertemuan</option>';
  pertemuanSet.forEach((p) => {
    const o = document.createElement("option");
    o.value = p;
    o.textContent = `Pertemuan ${p}`;
    filterSelect.appendChild(o);
  });
}
