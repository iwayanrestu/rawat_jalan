const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Tambahkan middleware CORS

// Inisialisasi Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyBwC31uIItv6HZjLNjP7zdbXibcAr2hx_k"); // Ganti dengan API Key Google Generative AI
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Variabel global untuk menyimpan konteks percakapan
let chat = null;

// Endpoint untuk live chat
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong." });
  }

  try {
    console.log("Mengirim pesan ke AI:", message);
    const websitecontext = `Website ini adalah platform rawat jalan yang menyediakan layanan kesehatan, termasuk konsultasi dokter, pendaftaran pasien, dan informasi medis. 
    Jawab dengan informasi yang akurat dan bantu pengguna mengakses layanan yang tersedia.
    Jika Pasien bertanya cara mendaftar maka jawab informasi berikut. Cara mendaftar sebagai pasien, pertama-tama arahkan ke bagian analisis gejala, berdasarkan gejala yang ada maka akan direkomendasikan dokter spesialis yang tersedia. 
    lalu ke bagian pendaftaran dimana pasien akan memberikan data 
    diri seperti nama dan memilih dokter yang tersedia. lalu pasien bisa melihat riwayat pendaftaran dan mengubah status nya apakah selesai atau belum selesai. Jika pasien bertanya mengenai langkah langkah, jelaskan penjelasan
    dengan mengggunakan bulletpoint. 
    Syarat Jawaban:
    1. Hindari penggunan bintang(*)
    2. Jawab dengan singkat dan jelas
    3. jangan sertakan link
    4. Jika pasien tidak bertanya mengenai cara mendaftar, jangan sertakan caranya
    5. Buat jawaban serapi mungkin
    6. jangan menyertakan jadwal dokter, jika pasien tidak mendaftar`;
    const dokterList = [
      {
        nama: "Dr. Andi Sutrisno",
        spesialisasi: "Kardiologi",
        jadwal: "Senin - Jumat, 08:00 - 12:00",
      },
      {
        nama: "Dr. Rina Sari",
        spesialisasi: "Hematologi",
        jadwal: "Senin - Kamis, 09:00 - 13:00",
      },
      {
        nama: "Dr. Budi Pratama",
        spesialisasi: "Penyakit Dalam",
        jadwal: "Selasa - Sabtu, 10:00 - 14:00",
      },
      {
        nama: "Dr. Maria Indriani",
        spesialisasi: "Kardiologi",
        jadwal: "Senin - Jumat, 07:00 - 11:00",
      },
      {
        nama: "Dr. Tono Lestari",
        spesialisasi: "Dermatologi",
        jadwal: "Rabu - Jumat, 09:00 - 15:00",
      },
      {
        nama: "Dr. Dita Yuliana",
        spesialisasi: "Oftalmologi",
        jadwal: "Senin - Jumat, 08:00 - 16:00",
      },
      {
        nama: "Dr. Ahmad Fadli",
        spesialisasi: "Neurologi",
        jadwal: "Senin - Kamis, 08:30 - 13:30",
      },
      {
        nama: "Dr. Siti Rosyidah",
        spesialisasi: "Telinga Hidung Tenggorokan (THT)",
        jadwal: "Selasa - Sabtu, 09:00 - 12:00",
      },
      {
        nama: "Dr. Fitrianti Marni",
        spesialisasi: "Pulmonologi",
        jadwal: "Senin - Jumat, 08:00 - 14:00",
      },
      {
        nama: "Dr. Henry Prabowo",
        spesialisasi: "Gigi dan Mulut",
        jadwal: "Senin - Kamis, 09:00 - 14:00",
      },
      {
        nama: "Dr. Johan Hartanto",
        spesialisasi: "Dokter Umum",
        jadwal: "Senin - Jumat, 08:00 - 17:00",
      },
    ];
    const dokterString = JSON.stringify(dokterList, null, 2);
    const promptchat = `Pengguna bertanya: '${message}'. ${websitecontext} 
    Jawablah dengan informasi yang akurat dan bantu pengguna mendapatkan layanan yang mereka butuhkan. 
    Jika pasien bertanya mengenai jadwal, ambil data dari list berikut ${dokterString}`;
    const response = await model.generateContent(promptchat);
    console.log("Respons AI:", JSON.stringify(response, null, 2)); // Debugging

    // Periksa apakah response memiliki struktur yang diharapkan
    if (
      !response ||
      !response.response ||
      !response.response.candidates ||
      response.response.candidates.length === 0
    ) {
      throw new Error("Respons AI tidak valid atau kosong.");
    }

    // Ambil teks dari response yang benar
    const textResponse =
      response.response.candidates[0]?.content?.parts?.[0]?.text ||
      "Maaf, saya tidak dapat menjawab saat ini.";

    res.json({ reply: textResponse });
  } catch (error) {
    console.error("Error during chat:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

// Endpoint untuk analisis gejala menggunakan Google Generative AI
app.post("/analyze", async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms) {
    return res.status(400).json({ error: "Gejala tidak boleh kosong." });
  }

  try {
    // Menggunakan prompt untuk menganalisis gejala
    const prompt = `Analisis gejala-gejala berikut dan sarankan dokter spesialis yang sesuai (tidak perlu penjelasan, 
    langsung ke nama spesialis(gunakan bahasa indonesia, contoh: kardiologi, hematologi dll), jika gejala umum maka rujuk ke dokter umum): ${symptoms}`;
    const result = await model.generateContent(prompt);

    // Ambil rekomendasi spesialis dari respons
    const specialist = result.response.text(); // Asumsi respons berupa string

    res.json({ specialist });
  } catch (error) {
    console.error("Error using Google Generative AI:", error);
    res.status(500).json({ error: "Error analyzing symptoms." });
  }
});

// Endpoint untuk mengambil dokter berdasarkan spesialis
app.get("/dokter/:spesialisasi", (req, res) => {
  const { spesialisasi } = req.params;

  db.query(
    "SELECT * FROM dokter WHERE spesialisasi = ?",
    [spesialisasi],
    (err, results) => {
      if (err) return res.status(500).send(err);

      res.json(results);
    }
  );
});

// Endpoint untuk menyimpan pendaftaran
app.post("/pendaftaran", (req, res) => {
  const { nama_pasien, spesialisasi, jadwal } = req.body;

  db.query(
    "INSERT INTO pendaftaran (nama_pasien, spesialisasi, jadwal) VALUES (?, ?, ?)",
    [nama_pasien, spesialisasi, jadwal],
    (err) => {
      if (err) return res.status(500).send(err);

      res.json({ message: "Pendaftaran berhasil!" });
    }
  );
});
// Endpoint untuk mendapatkan daftar pendaftaran
app.get("/pendaftaran", (req, res) => {
  db.query("SELECT * FROM pendaftaran", (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

// Endpoint untuk memperbarui status pendaftaran menjadi selesai
app.put("/pendaftaran/:id/selesai", (req, res) => {
  const { id } = req.params;

  // Perbarui status rawat jalan ke 'selesai'
  db.query(
    "UPDATE pendaftaran SET status = 'selesai' WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Pendaftaran tidak ditemukan." });
      }

      res.json({ message: "Status rawat jalan telah selesai." });
    }
  );
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
