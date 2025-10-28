// ==============================
// LIHAT MAKALAH (support: PDF, DOCX, PPTX, XLSX) — versi FIX FINAL OFFLINE
// ==============================

// Ambil parameter dari URL
const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get("id"));
const matkulParam = params.get("matkul");

if (!id || !matkulParam) {
  document.getElementById("statusText").textContent = "❌ Parameter ID atau matkul tidak valid.";
  throw new Error("Parameter tidak lengkap");
}

let db;
let dbName = "";

// Tentukan nama database sesuai matkul
switch (matkulParam) {
  case "dasar-dasar-akuntansi":
    dbName = "DB_DasarAkuntansi";
    break;
  case "filsafat-pendidikan":
    dbName = "DB_FilsafatPendidikan";
    break;
  case "administrasi-manajemen-pendidikan":
    dbName = "DB_AdministrasiManajemenPendidikan";
    break;
  case "pendidikan-pancasila":
    dbName = "DB_PendidikanPancasila";
    break;
  case "studi-al-quran":
    dbName = "DB_StudiAlQuran";
    break;
  case "bahasa-inggris":
    dbName = "DB_BahasaInggris";
    break;
  case "studi-fikih":
    dbName = "DB_StudiFikih";
    break;
  case "akhlak-tasawuf":
    dbName = "DB_AkhlakTasawuf";
    break;
  case "budaya-organisasi":
    dbName = "DB_BudayaOrganisasi";
    break;
  case "studi-hadist":
    dbName = "DB_StudiHadist";
    break;
  case "dasar-dasar-manajemen":
    dbName = "DB_DasarManajemen";
    break;
  case "ilmu-tauhid":
    dbName = "DB_IlmuTauhid";
    break;
  default:
    dbName = "DB_DasarAkuntansi";
}


// ==============================
// Buka IndexedDB
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const request = indexedDB.open(dbName, 1);

  request.onsuccess = (e) => {
    db = e.target.result;
    loadMakalah();
  };

  request.onerror = (e) => {
    console.error("❌ Gagal membuka IndexedDB:", e.target.error);
    document.getElementById("statusText").textContent = "❌ Gagal membuka database.";
  };
});

// ==============================
// Ambil data makalah dan tampilkan
// ==============================
function loadMakalah() {
  const tx = db.transaction("makalahData", "readonly");
  const store = tx.objectStore("makalahData");
  const req = store.get(id);

  req.onsuccess = () => {
    const data = req.result;
    const statusText = document.getElementById("statusText");
    const infoPertemuan = document.getElementById("infoPertemuan");
    const fileContainer = document.getElementById("fileContainer");

    if (!data) {
      statusText.textContent = "❌ File tidak ditemukan di database.";
      return;
    }

    // Bersihkan teks loading
    statusText.textContent = "";

    // ==============================
    // Info makalah tampil rapi
    // ==============================
    infoPertemuan.innerHTML = `
      <div class="makalah-info" style="padding:15px;max-width:600px;margin:auto;text-align:left;">
        <h3 style="margin-bottom:8px;color:#111;">${data.judul}</h3>
        <p><strong>Kelompok:</strong> ${data.kelompok}</p>
        <p><strong>Tanggal:</strong> ${data.tanggal}</p>
        <p><strong>Pertemuan:</strong> ${data.pertemuan}</p>
        <p><strong>Nama File:</strong> ${data.fileName}</p>
        <button id="downloadBtn" style="margin-top:12px;padding:10px 18px;background:#1d4ed8;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">⬇️ Download File</button>
      </div>
    `;

    // ==============================
    // Tampilkan file (preview / notifikasi)
    // ==============================
    fileContainer.innerHTML = "";
    const ext = data.fileName.split(".").pop().toLowerCase();

    // Konversi Base64 ke Blob untuk preview/download
    const blob = dataURLtoBlob(data.fileData);
    const blobUrl = URL.createObjectURL(blob);

    if (ext === "pdf") {
      // PDF bisa langsung ditampilkan
      const embed = document.createElement("embed");
      embed.src = blobUrl;
      embed.type = "application/pdf";
      embed.width = "100%";
      embed.height = "600px";
      embed.style.borderRadius = "10px";
      embed.style.marginTop = "20px";
      fileContainer.appendChild(embed);
    } else if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
      // Format Office (tidak bisa preview lokal)
      const info = document.createElement("div");
      info.style.textAlign = "center";
      info.style.marginTop = "40px";
      info.innerHTML = `
        <i class="fa-solid fa-file-word" style="font-size:60px;color:#2563eb;margin-bottom:10px;"></i>
        <p style="font-size:16px;">
          File <b>.${ext}</b> tidak bisa ditampilkan langsung di browser.<br>
          Silakan klik tombol <b>⬇️ Download File</b> untuk membukanya di Microsoft Office atau WPS.
        </p>
      `;
      fileContainer.appendChild(info);
    } else {
      // Format lain
      const info = document.createElement("div");
      info.style.textAlign = "center";
      info.style.marginTop = "30px";
      info.innerHTML = `
        <i class="fa-solid fa-file" style="font-size:60px;color:#6b7280;margin-bottom:10px;"></i>
        <p style="font-size:16px;">Format file <b>.${ext}</b> belum didukung untuk pratinjau.<br>
        Silakan klik tombol <b>Download File</b>.</p>
      `;
      fileContainer.appendChild(info);
    }

    // ==============================
    // Tombol Download (fix semua format)
    // ==============================
    document.getElementById("downloadBtn").addEventListener("click", () => {
      const a = document.createElement("a");
      const blob = dataURLtoBlob(data.fileData);
      const blobUrl = URL.createObjectURL(blob);
      a.href = blobUrl;
      a.download = data.fileName;
      a.click();
    });
  };

  req.onerror = (e) => {
    console.error("❌ Gagal memuat makalah:", e.target.error);
    document.getElementById("statusText").textContent = "❌ Terjadi kesalahan saat memuat file.";
  };
}

// ==============================
// Helper: Konversi Base64 → Blob
// ==============================
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
