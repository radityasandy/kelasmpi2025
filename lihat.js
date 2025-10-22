import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

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

// Ambil ID makalah dari URL ?id=...
const params = new URLSearchParams(window.location.search);
const makalahId = params.get("id");

const statusText = document.getElementById("statusText");
const infoMakalah = document.getElementById("infoMakalah");
const fileContainer = document.getElementById("fileContainer");

if(!makalahId){
  statusText.textContent = "ID makalah tidak ditemukan!";
} else {
  loadMakalah(makalahId);
}

async function loadMakalah(id){
  try{
    const docRef = doc(db, "makalah", id);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()){
      const data = docSnap.data();
      statusText.style.display = "none";

      // Info makalah
      infoMakalah.innerHTML = `
        <p><strong>Judul:</strong> ${data.judul}</p>
        <p><strong>Kelompok:</strong> ${data.kelompok}</p>
        <p><strong>Tanggal:</strong> ${data.tanggal || "-"}</p>
      `;

      // File preview / link download
      if(data.fileUrl){
        const fileUrl = data.fileUrl;
        const ext = fileUrl.split('.').pop().toLowerCase();
        let fileHTML = "";

        if(ext === "pdf"){
          fileHTML = `<iframe src="${fileUrl}" width="100%" height="600px"></iframe>`;
        } else if(["ppt","pptx"].includes(ext)){
          fileHTML = `<p>File PPT: <a href="${fileUrl}" target="_blank">Download PPT</a></p>`;
        } else {
          fileHTML = `<p>File: <a href="${fileUrl}" target="_blank">Download</a></p>`;
        }

        fileHTML += `<p><a href="${fileUrl}" target="_blank">⬇️ Download</a></p>`;
        fileContainer.innerHTML = fileHTML;
      }

    } else {
      statusText.textContent = "Makalah tidak ditemukan!";
    }
  } catch(err){
    console.error(err);
    statusText.textContent = "Gagal memuat makalah!";
  }
}
