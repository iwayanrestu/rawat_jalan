// Analisis gejala menggunakan AI dan tampilkan rekomendasi spesialis
async function analyzeSymptoms() {
  const symptom = document.getElementById("symptom").value;

  if (!symptom) {
    alert("Harap masukkan gejala Anda.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: symptom }),
    });

    const data = await response.json();
    document.getElementById(
      "specialist-result"
    ).innerText = `Rekomendasi Spesialis: ${data.specialist}`;

    // Ambil daftar dokter dari spesialis yang direkomendasikan
    const doctors = await fetch(
      `http://localhost:3000/dokter/${data.specialist}`
    );
    const doctorList = await doctors.json();
    const select = document.getElementById("doctorList");

    select.innerHTML = '<option value="">Pilih dokter</option>'; // Reset opsi sebelumnya
    doctorList.forEach((doctor) => {
      const option = document.createElement("option");
      option.value = doctor.jadwal;
      option.textContent = `${doctor.nama} (${doctor.jadwal})`;
      select.appendChild(option);
    });
  } catch (error) {
    alert("Terjadi kesalahan saat menganalisis gejala.");
    console.error(error);
  }
}

// Daftarkan pasien berdasarkan pilihan dokter
async function register() {
  const namaPasien = document.getElementById("namaPasien").value;
  const jadwal = document.getElementById("doctorList").value;
  const specialist = document
    .getElementById("specialist-result")
    .innerText.split(": ")[1];

  if (!namaPasien || !jadwal || !specialist) {
    alert("Harap lengkapi semua data sebelum mendaftar.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/pendaftaran", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama_pasien: namaPasien,
        spesialisasi: specialist,
        jadwal: jadwal,
      }),
    });

    const data = await response.json();
    alert(data.message);
  } catch (error) {
    alert("Terjadi kesalahan saat mendaftarkan pasien.");
    console.error(error);
  }
}

function toggleChat() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;

  if (chatBox.style.display === "none" || chatBox.style.display === "") {
    chatBox.style.display = "flex";
    chatBox.classList.add("show");
  } else {
    chatBox.classList.remove("show");
    setTimeout(() => {
      chatBox.style.display = "none";
    }, 300);
  }
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");

  if (!input || !messages) return;

  const userText = input.value.trim();
  if (userText === "") return;

  appendMessage(userText, "user-message");

  scrollToBottom();

  // Loading Indicator
  const loadingMessage = document.createElement("div");
  loadingMessage.classList.add("loading-message");
  loadingMessage.textContent = "Mengetik...";
  messages.appendChild(loadingMessage);
  input.value = "";

  try {
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });

    messages.removeChild(loadingMessage);
    const data = await response.json();
    appendMessage(data.reply, "model-message");
  } catch (error) {
    messages.removeChild(loadingMessage);
    appendMessage("Terjadi kesalahan saat mengirim pesan.", "error-message");
  }

  scrollToBottom();
}

function appendMessage(text, className) {
  const messages = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add(className, "fade-in");
  messageDiv.textContent = text;
  messages.appendChild(messageDiv);
}

function scrollToBottom() {
  const messages = document.getElementById("chatMessages");
  messages.scrollTop = messages.scrollHeight;
}
