// ==============================
// KONEKSI SUPABASE
// ==============================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Ganti dengan kredensial milikmu
const supabaseUrl = "https://gufbusvnoscociobvxxn.supabase.co";
const supabaseAnonKey = "process.env.SUPABASE_KEY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==============================
// UPLOAD MAKALAH DASAR AKUNTANSI
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("makalahForm");
  const tableBody = document.querySelector("#makalahTable tbody");
  const searchInput = document.getElementById("searchInput");

  // Ambil data saat halaman dimuat
  await loadMakalah();

  // ============================
  // UPLOAD FILE BARU
  // ============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const judul = document.getElementById("judul").value.trim();
    const kelompok = document.getElementById("kelompok").value.trim();
    const tanggal = document.getElementById("tanggal").value;
    const pertemuan = parseInt(document.getElementById("pertemuan").value);
    const fileInput = document.getElementById("file");

    if (!fileInput.files.length) {
      alert("Pilih file terlebih dahulu!");
      return;
    }

    const file = fileInput.files[0];
    const fileName = `${Date.now()}_${file.name}`;

    try {
      // Upload file ke bucket Supabase
      const { data, error } = await supabase.storage
        .from("makalah_dan_ppt")
        .upload(fileName, file);

      if (error) throw error;

      // Ambil URL publik file
      const { data: publicUrlData } = supabase.storage
        .from("makalah_dan_ppt")
        .getPublicUrl(fileName);

      const fileUrl = publicUrlData.publicUrl;

      // Simpan metadata ke tabel Supabase
      const { error: insertError } = await supabase
        .from("makalah_dan_ppt_data")
        .insert([
          {
            judul,
            kelompok,
            tanggal,
            pertemuan,
            file_name: fileName,
            file_url: fileUrl,
          },
        ]);

      if (insertError) throw insertError;

      alert("✅ Makalah berhasil diunggah!");
      form.reset();
      await loadMakalah();
    } catch (err) {
      console.error("❌ Gagal upload:", err.message);
      alert("❌ Gagal mengunggah makalah: " + err.message);
    }
  });

  // ============================
  // MUAT DATA DARI SUPABASE
  // ============================
  async function loadMakalah() {
    tableBody.innerHTML = "<tr><td colspan='6'>⏳ Memuat data...</td></tr>";

    const { data, error } = await supabase
      .from("makalah_dan_ppt_data")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      tableBody.innerHTML = "<tr><td colspan='6'>❌ Gagal memuat data!</td></tr>";
      console.error("Load error:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6'>Belum ada makalah diunggah.</td></tr>";
      return;
    }

    renderTable(data);
  }

  // ============================
  // RENDER DATA KE TABEL
  // ============================
  function renderTable(rows) {
    tableBody.innerHTML = "";
    rows.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.judul}</td>
        <td>${item.kelompok}</td>
        <td>${item.tanggal}</td>
        <td>${item.pertemuan}</td>
        <td><a href="${item.file_url}" target="_blank">${item.file_name}</a></td>
        <td>
          <button class="delete-btn" data-id="${item.id}" style="background:#dc2626;color:white;border:none;padding:6px 10px;border-radius:5px;cursor:pointer;">
            Hapus
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Tombol hapus
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Yakin ingin menghapus makalah ini?")) {
          const { error } = await supabase.from("makalah_dan_ppt_data").delete().eq("id", id);
          if (error) {
            alert("❌ Gagal menghapus data: " + error.message);
          } else {
            alert("✅ Data berhasil dihapus!");
            await loadMakalah();
          }
        }
      });
    });
  }

  // ============================
  // FITUR CARI
  // ============================
  searchInput.addEventListener("input", async (e) => {
    const keyword = e.target.value.toLowerCase();

    const { data, error } = await supabase
      .from("const { data, error } = await supabase
  .from("makalah_dan_ppt")
  .select("*");
")
      .select("*")
      .or(
        `judul.ilike.%${keyword}%,kelompok.ilike.%${keyword}%,pertemuan::text.ilike.%${keyword}%`
      )
      .order("id", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    renderTable(data);
  });
});

