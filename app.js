"use strict";

const byId = (id) => document.getElementById(id);
const audio = byId("audio");
const progress = byId("progress");
const volume = byId("volume");
const playbackStatus = byId("playback-status");
const recordStatus = byId("record-status");
const recordButton = byId("record");
const recordingButton = byId("play-recording");
const fileButton = byId("play-file");
const speed = byId("speed");
// Explicit relative paths keep the library usable on static hosts, including GitHub Pages.
const arabicLibrary = [
  { title: "مقاطع الحروف", folder: "syllables", tracks: [
    ["ba", "بَ"], ["bi", "بِ"], ["bu", "بُ"],
    ["ma", "مَ"], ["mi", "مِ"], ["mu", "مُ"],
    ["sa", "سَ"], ["si", "سِ"], ["su", "سُ"],
    ["ta", "تَ"], ["ti", "تِ"], ["tu", "تُ"],
  ] },
  { title: "الكلمات", folder: "words", tracks: [
    ["bab", "باب"], ["baba", "بابا"], ["bayt", "بيت"],
    ["kitab", "كتاب"], ["kura", "كرة"], ["ma", "ماء"],
    ["mama", "ماما"], ["qalam", "قلم"], ["qamar", "قمر"],
    ["sayyara", "سيارة"], ["shams", "شمس"], ["tuffaha", "تفاحة"],
  ] },
  { title: "الجمل", folder: "sentences", tracks: [
    ["ana_aktub", "أنا أكتب"], ["ayna_kura", "أين الكرة؟"],
    ["bint_taqra", "البنت تقرأ"], ["hadha_bab", "هذا باب"],
    ["hadha_bayt", "هذا بيت"], ["iftah_bab", "افتح الباب"],
    ["urid_ma", "أريد ماء"], ["walad_yalab", "الولد يلعب"],
  ] },
];

for (const section of arabicLibrary) {
  const details = document.createElement("details");
  details.className = "library-section";
  const summary = document.createElement("summary");
  summary.textContent = `${section.title} (${section.tracks.length})`;
  const list = document.createElement("ul");
  list.className = "tracks";
  for (const [filename, title] of section.tracks) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = title;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.source = `sounds/${section.folder}/${filename}.mp3`;
    button.dataset.title = title;
    button.textContent = "تشغيل";
    item.append(label, button);
    list.append(item);
  }
  details.append(summary, list);
  byId("arabic-library").append(details);
}

const playButtons = document.querySelectorAll("[data-source], #play-recording, #play-file");
const samples = new Map();
const sampleUrls = [];
let selected;
let playAttempt = 0;
let audioContext;
let gain;
let recordingUrl;
let fileUrl;
let recordingDuration = 0;
let recorder;
let microphone;
let timer;
let pageActive = true;

function formatTime(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function updateVolume() {
  const level = Number(volume.value) / 100;
  byId("volume-value").value = `${volume.value}%`;
  audio.volume = level;
  if (gain) gain.gain.value = level;
}

function updateSpeed() {
  const rate = Number(speed.value);
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
  for (const property of ["preservesPitch", "webkitPreservesPitch", "mozPreservesPitch"]) {
    if (property in audio) audio[property] = true;
  }
}

function updatePlayer() {
  byId("player-toggle").disabled = !selected;
  byId("stop").disabled = !selected;
  byId("player-toggle").textContent = selected && !audio.paused && !audio.ended ? "إيقاف مؤقت" : "تشغيل";
  const duration = Number.isFinite(audio.duration) ? audio.duration
    : selected === recordingButton && !audio.error ? recordingDuration : 0;
  progress.disabled = !duration || Boolean(audio.error);
  progress.max = duration || 1;
  progress.value = audio.currentTime;
  byId("elapsed").textContent = formatTime(audio.currentTime);
  byId("duration").textContent = formatTime(duration);
  for (const button of playButtons) {
    const playing = button === selected && !audio.paused && !audio.ended;
    button.textContent = playing ? "إيقاف مؤقت" : "تشغيل";
    button.setAttribute("aria-label", `${button.textContent} — ${button.dataset.title || "ملف من جهازك"}`);
  }
}

function clearPlayer() {
  playAttempt++;
  selected = undefined;
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  byId("current").textContent = "اختر صوتًا للتشغيل";
  playbackStatus.textContent = "";
  updatePlayer();
}

function playbackError() {
  playbackStatus.textContent = "تعذّر تشغيل الصوت. تحقّق من الملف أو جرّب صيغة صوتية أخرى.";
  updatePlayer();
}

async function togglePlayback(button) {
  if (button === selected && !audio.paused && !audio.ended) {
    playAttempt++;
    audio.pause();
    return;
  }

  const attempt = ++playAttempt;
  playbackStatus.textContent = "";
  if (button !== selected || audio.error || !audio.getAttribute("src")) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    selected = button;
    byId("current").textContent = button.dataset.title;
    updatePlayer();
    const sample = samples.get(button);
    const source = sample ? await sample : button.dataset.source;
    if (attempt !== playAttempt) return;
    audio.src = source;
  }
  updateSpeed();
  try {
    // Some mobile browsers ignore HTMLMediaElement.volume.
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioContext && audio.volume !== Number(volume.value) / 100 &&
        AudioContext && location.protocol !== "file:") {
      audioContext = new AudioContext();
      gain = audioContext.createGain();
      gain.gain.value = Number(volume.value) / 100;
      audioContext.createMediaElementSource(audio).connect(gain).connect(audioContext.destination);
    }
    const ready = audioContext?.resume();
    await Promise.all([ready, audio.play()]);
    if (!gain && audio.volume !== Number(volume.value) / 100 && attempt === playAttempt) {
      playbackStatus.textContent = "استخدم أزرار مستوى الصوت في جهازك لضبط الصوت.";
    }
  } catch {
    if (attempt === playAttempt) {
      audio.pause();
      playbackError();
    }
  }
}

for (const button of playButtons) {
  button.addEventListener("click", () => togglePlayback(button));
  if (!button.dataset.source || location.protocol === "file:") continue;
  // Buffer bundled samples so seeking also works on servers without byte ranges.
  const source = button.dataset.source;
  samples.set(button, fetch(source).then((response) => {
    if (!response.ok) throw new Error("Sample unavailable");
    return response.blob();
  }).then((blob) => {
    if (!pageActive) return source;
    const url = URL.createObjectURL(blob);
    sampleUrls.push(url);
    return url;
  }).catch(() => source));
}
for (const event of ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended", "emptied"]) {
  audio.addEventListener(event, updatePlayer);
}
audio.addEventListener("error", () => {
  if (selected && audio.error) playbackError();
});
progress.addEventListener("input", () => {
  audio.currentTime = Number(progress.value);
});
volume.addEventListener("input", updateVolume);
speed.addEventListener("change", updateSpeed);
byId("reset-speed").addEventListener("click", () => {
  speed.value = "1";
  updateSpeed();
});
byId("player-toggle").addEventListener("click", () => {
  if (selected) togglePlayback(selected);
});
byId("stop").addEventListener("click", () => {
  playAttempt++;
  audio.pause();
  audio.currentTime = 0;
  updatePlayer();
});
updateSpeed();
updateVolume();
updatePlayer();

byId("file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (selected === fileButton) clearPlayer();
  if (fileUrl) URL.revokeObjectURL(fileUrl);
  fileUrl = URL.createObjectURL(file);
  fileButton.dataset.source = fileUrl;
  fileButton.dataset.title = file.name;
  fileButton.setAttribute("aria-label", `تشغيل — ${file.name}`);
  byId("file-name").textContent = file.name;
  byId("file-result").hidden = false;
  event.target.value = "";
});

function releaseMicrophone() {
  clearInterval(timer);
  microphone?.getTracks().forEach((track) => track.stop());
  microphone = undefined;
}

function finishRecording() {
  releaseMicrophone();
  recorder = undefined;
  recordButton.disabled = false;
  recordButton.textContent = "بدء التسجيل";
}

function saveRecording(blob, duration) {
  if (selected === recordingButton) clearPlayer();
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  recordingDuration = duration;
  recordingUrl = URL.createObjectURL(blob);
  recordingButton.dataset.source = recordingUrl;
  const extensions = { webm: "webm", ogg: "ogg", mp4: "m4a", aac: "aac", wav: "wav", mpeg: "mp3" };
  const subtype = blob.type.split(";")[0].split("/")[1];
  const download = byId("download");
  download.href = recordingUrl;
  download.download = `cochlear-recording.${extensions[subtype] || "audio"}`;
  byId("record-result").hidden = false;
}

function microphoneError(error) {
  if (["NotAllowedError", "SecurityError"].includes(error.name)) {
    return "لم يُسمح بالوصول إلى الميكروفون. تحقّق من أذونات الموقع.";
  }
  if (error.name === "NotFoundError") return "لم يتم العثور على ميكروفون متاح.";
  if (error.name === "NotReadableError") return "الميكروفون مشغول أو تعذّر الوصول إليه.";
  return "تعذّر تسجيل الصوت. تحقّق من الميكروفون وحاول مرة أخرى.";
}

async function startRecording() {
  recordButton.disabled = true;
  recordStatus.textContent = "بانتظار إذن الميكروفون…";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!pageActive) {
      stream.getTracks().forEach((track) => track.stop());
      finishRecording();
      return;
    }
    microphone = stream;
    const activeRecorder = new MediaRecorder(microphone);
    const chunks = [];
    let failed = false;

    activeRecorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) chunks.push(event.data);
    });
    activeRecorder.addEventListener("error", () => {
      failed = true;
      recordStatus.textContent = "حدث خطأ أثناء التسجيل. حاول مرة أخرى.";
      releaseMicrophone();
    });
    const startedAt = performance.now();
    const duration = () => (performance.now() - startedAt) / 1000;
    activeRecorder.addEventListener("stop", () => {
      const seconds = duration();
      byId("timer").textContent = formatTime(seconds);
      finishRecording();
      if (failed || !pageActive) return;
      const blob = new Blob(chunks, { type: activeRecorder.mimeType || chunks[0]?.type });
      if (!blob.size) {
        recordStatus.textContent = "لم يُحفظ صوت. جرّب تسجيل مقطع أطول.";
        return;
      }
      saveRecording(blob, seconds);
      recordStatus.textContent = "التسجيل جاهز.";
    });
    audio.pause();
    activeRecorder.start();
    recorder = activeRecorder;
    byId("timer").textContent = "0:00";
    timer = setInterval(() => {
      byId("timer").textContent = formatTime(duration());
    }, 200);
    recordButton.textContent = "إيقاف التسجيل";
    recordButton.disabled = false;
    recordStatus.textContent = "جارٍ التسجيل…";
  } catch (error) {
    finishRecording();
    recordStatus.textContent = microphoneError(error);
  }
}

if (!window.isSecureContext) {
  recordButton.disabled = true;
  recordStatus.textContent = "يتطلب الميكروفون فتح الصفحة عبر HTTPS أو localhost.";
} else if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
  recordButton.disabled = true;
  recordStatus.textContent = "التسجيل غير متاح في هذا المتصفح.";
}

recordButton.addEventListener("click", () => {
  if (!recorder) {
    startRecording();
    return;
  }
  if (recorder.state === "inactive") return;
  recordButton.disabled = true;
  recordStatus.textContent = "جارٍ تجهيز التسجيل…";
  recorder.stop();
  releaseMicrophone();
});

window.addEventListener("pageshow", () => { pageActive = true; });
window.addEventListener("pagehide", (event) => {
  pageActive = event.persisted;
  playAttempt++;
  audio.pause();
  if (recorder?.state === "recording") recorder.stop();
  releaseMicrophone();
  if (event.persisted) return;
  sampleUrls.forEach((url) => URL.revokeObjectURL(url));
  if (fileUrl) URL.revokeObjectURL(fileUrl);
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
});
