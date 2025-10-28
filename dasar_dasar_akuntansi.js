// ==============================
// KONFIGURASI SUPABASE
// ==============================
// dasarakuntansi.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// === KONFIGURASI SUPABASE ===
const supabaseUrl = 'https://gufbusvnoscociobvxxn.supabase.co'
const supabaseKey = 'ISI_DENGAN_ANON_KEY_KAMU'  // Ganti dengan anon public key dari Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

// Nama tabel
const TABLE_NAME = "makalah_dasar_akuntansi";

// ==============================
// EVENT: Submit Form Upload
// ==============================
document.getElementById("makalahForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const judul = document.getElementById("judul").value.trim();
  const kelompok = document.getElementById("kelompok").value.trim();
  const tanggal = document.getElementById("tanggal").value;
  const pertemuan = document.getElementById("pertemuan").value;
  const file = document.getElementById("file").files[0];

  if (!file) return alert("⚠️ Pilih file terlebih dahulu!");

  // Tentukan bucket berdasarkan ekstensi file
  const ext = file.name.split(".").pop().toLowerCase();
  let bucketName = "makalah";
  if (["ppt", "pptx"].includes(ext)) {
    bucketName = "ppt";
  }

  // Upload ke bucket yang sesuai
  const fileName = `${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file);

  if (uploadError) {
    console.error(uploadError);
    alert("❌ Gagal mengunggah file ke bucket Supabase!");
    return;
  }

  // Ambil URL publik
  const { data: publicUrl } = supabase.storage.from(bucketName).getPublicUrl(fileName);

  // Simpan metadata ke tabel Supabase
  const { error: insertError } = await supabase.from(TABLE_NAME).insert([
    {
      judul,
      kelompok,
      tanggal,
      pertemuan,
      file_name: file.name,
      file_url: publicUrl.publicUrl,
      file_type: ext,
      bucket: bucketName,
    },
  ]);

  if (insertError) {
    console.error(insertError);
    alert("❌ Gagal menyimpan data makalah ke tabel!");
    return;
  }

  alert("✅ Makalah berhasil diupload!");
  e.target.reset();
  loadTable();
});

// ==============================
// FUNGSI: Tampilkan Tabel
// ==============================
async function loadTable() {
  const tbody = document.querySelector("#makalahTable tbody");
  tbody.innerHTML = "<tr><td colspan='5'>⏳ Memuat data...</td></tr>";

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    tbody.innerHTML = "<tr><td colspan='5'>❌ Gagal memuat data!</td></tr>";
    return;
  }

  if (!data.length) {
    tbody.innerHTML = "<tr><td colspan='5'>Belum ada makalah diunggah.</td></tr>";
    return;
  }

  tbody.innerHTML = "";
  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.judul}</td>
      <td>${item.kelompok}</td>
      <td>${item.tanggal}</td>
      <td>${item.pertemuan}</td>
      <td>
        <a href="${item.file_url}" target="_blank" class="btn">Lihat File</a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Jalankan saat halaman dimuat
loadTable();
