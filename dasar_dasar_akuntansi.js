// ==============================
// KONFIGURASI SUPABASE
// ==============================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://gufbusvnoscociobvxxn.supabase.co"; // Ganti dengan URL milikmu
const SUPABASE_KEY = "YOUR_ANON_KEY_HERE"; // Ganti dengan anon key kamu
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==============================
// AMBIL ELEMEN DOM
// ==============================
const form = document.getElementById("makalahForm");
const tableBody = document.querySelector("#makalahTable tbody");
const searchInput = document.getElementById("searchInput");

// ==============================
// FUNGSI UPLOAD MAKALAH
// ==============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const judul = document.getElementById("judul").value.trim();
  const kelompok = document.getElementById("kelompok").value.trim();
  const tanggal = document.getElementById("tanggal").value;
  const pertemuan = parseInt(document.getElementById("pertemuan").value);
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  if (!file) {
    alert("Pilih file terlebih dahulu!");
    return;
  }

  const ext = file.name.split(".").pop().toLowerCase();
  const bucketName = ["pdf", "doc", "docx"].includes(ext) ? "makalah" : "ppt";

  const filePath = `${Date.now()}_${file.name}`;

  // Upload ke Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (uploadError) {
    console.error(uploadError);
    alert("❌ Gagal upload file ke Storage!");
    return;
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  const file_url = urlData.publicUrl;

  // Simpan metadata ke tabel
  const { error: insertError } = await supabase.from("makalah_list").insert([
    {
      judul,
      kelompok,
      tanggal,
      pertemuan,
      file_url,
      nama_file: file.name,
    },
  ]);

  if (insertError) {
    console.error(insertError);
    alert("❌ Gagal menyimpan ke database!");
  } else {
    alert("✅ Makalah berhasil ditambahkan!");
    form.reset();
    loadMakalah();
  }
});

// ==============================
// FUNGSI MUAT DATA
// ==============================
async function loadMakalah() {
  const { data, error } = await supabase
    .from("makalah_list")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Error ambil data:", error);
    alert("❌ Gagal memuat data!");
    return;
  }

  tableBody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.judul}</td>
      <td>${item.kelompok}</td>
      <td>${item.tanggal}</td>
      <td>${item.pertemuan}</td>
      <td><a href="${item.file_url}" target="_blank">${item.nama_file}</a></td>
      <td><button class="delete-btn" data-id="${item.id}">Hapus</button></td>
    `;
    tableBody.appendChild(row);
  });
}

// ==============================
// FUNGSI HAPUS DATA
// ==============================
tableBody.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    if (confirm("Yakin ingin menghapus makalah ini?")) {
      const { error } = await supabase.from("makalah_list").delete().eq("id", id);
      if (error) {
        alert("❌ Gagal menghapus data!");
      } else {
        alert("✅ Data berhasil dihapus!");
        loadMakalah();
      }
    }
  }
});

// ==============================
// FILTER PENCARIAN
// ==============================
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const rows = tableBody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName("td");
    const match = Array.from(cells).some((cell) =>
      cell.textContent.toLowerCase().includes(keyword)
    );
    rows[i].style.display = match ? "" : "none";
  }
});

// ==============================
// LOAD DATA SAAT AWAL
// ==============================
loadMakalah();
