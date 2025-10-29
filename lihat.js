// ==============================
// LIHAT MAKALAH (versi konek Supabase Bucket makalah_dan_ppt)
// ==============================

// Import Supabase (pakai CDN agar bisa jalan di browser)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === KONFIGURASI SUPABASE ===
// dasarakuntansi.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Ganti dengan kredensial milikmu
const supabaseUrl = "https://gufbusvnoscociobvxxn.supabase.co";
const supabaseAnonKey = "process.env.SUPABASE_KEY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// === Ambil parameter dari URL ===
const params = new URLSearchParams(window.location.search);
const fileName = params.get("file"); // nama file yang dikirim lewat URL
const title = params.get("judul") || "Makalah / PPT";

// === Elemen HTML ===
const statusText = document.getElementById("statusText");
const infoPertemuan = document.getElementById("infoPertemuan");
const fileContainer = document.getElementById("fileContainer");

// === Validasi parameter ===
if (!fileName) {
  statusText.textContent = "❌ Nama file tidak ditemukan di URL.";
  throw new Error("Parameter file kosong");
}

// === Load file dari Supabase ===
async function loadMakalah() {
  try {
    statusText.textContent = "⏳ Sedang memuat file...";

    // Ambil URL publik dari bucket
    const { data, error } = await supabase.storage
      .from("makalah_dan_ppt")
      .getPublicUrl(`makalah_dan_ppt/${fileName}`);

    if (error || !data) throw error || new Error("File tidak ditemukan di Supabase.");

    const fileUrl = data.publicUrl;
    statusText.textContent = "";

    // === Info makalah tampil rapi ===
    infoPertemuan.innerHTML = `
      <div class="makalah-info" style="padding:15px;max-width:600px;margin:auto;text-align:left;">
        <h3 style="margin-bottom:8px;color:#111;">${title}</h3>
        <p><strong>Nama File:</strong> ${fileName}</p>
        <button id="downloadBtn" style="margin-top:12px;padding:10px 18px;background:#1d4ed8;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">⬇️ Download File</button>
      </div>
    `;

    // === Tampilkan preview sesuai format ===
    const ext = fileName.split(".").pop().toLowerCase();
    fileContainer.innerHTML = "";

    if (ext === "pdf") {
      const embed = document.createElement("embed");
      embed.src = fileUrl;
      embed.type = "application/pdf";
      embed.width = "100%";
      embed.height = "600px";
      embed.style.borderRadius = "10px";
      embed.style.marginTop = "20px";
      fileContainer.appendChild(embed);
    } else if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
      const info = document.createElement("div");
      info.style.textAlign = "center";
      info.style.marginTop = "40px";
      info.innerHTML = `
        <i class="fa-solid fa-file-word" style="font-size:60px;color:#2563eb;margin-bottom:10px;"></i>
        <p style="font-size:16px;">
          File <b>.${ext}</b> tidak bisa ditampilkan langsung di browser.<br>
          Klik tombol <b>⬇️ Download File</b> untuk membukanya.
        </p>
      `;
      fileContainer.appendChild(info);
    } else {
      const info = document.createElement("div");
      info.style.textAlign = "center";
      info.style.marginTop = "30px";
      info.innerHTML = `
        <i class="fa-solid fa-file" style="font-size:60px;color:#6b7280;margin-bottom:10px;"></i>
        <p style="font-size:16px;">Format file <b>.${ext}</b> belum didukung untuk pratinjau.<br>
        Klik tombol <b>Download File</b>.</p>
      `;
      fileContainer.appendChild(info);
    }

    // === Tombol Download ===
    document.getElementById("downloadBtn").addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileName;
      a.click();
    });
  } catch (err) {
    console.error("❌ Gagal memuat file:", err.message);
    statusText.textContent = "❌ Terjadi kesalahan saat memuat file dari Supabase.";
  }
}

// Jalankan setelah halaman siap
document.addEventListener("DOMContentLoaded", loadMakalah);

