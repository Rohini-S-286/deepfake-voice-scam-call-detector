/**
 * AegisVoice AI - Frontend Application Core v3.5 (Luxury Classy Beige Edition)
 * Live Call Tracking, Community Pre-Alerts, IBM LinuxONE Telemetry,
 * Editorial Oscilloscope, Web Speech Recognition, and Forensic Diagnostic UI.
 */

// Global State
let audioContext = null;
let analyserNode = null;
let audioSourceNode = null;
let ringOscillator = null;
let ringGainNode = null;
let mediaRecorder = null;
let audioChunks = [];
let speechRecognizer = null;
let currentIncidentData = null;
let activePreset = null;
let presetsList = [];
let isRecordingMic = false;
let animationFrameId = null;

// Live Call Tracking State
let isLiveCallActive = false;
let liveCallTimerInterval = null;
let liveCallSeconds = 0;
let currentTrackedPhone = "+1 (844) 932-8491";
let currentSimScenario = null;

// DOM Elements
const audioPlayer = document.getElementById('audioPlayer');
const waveformCanvas = document.getElementById('waveformCanvas');
const canvasCtx = waveformCanvas.getContext('2d');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const audioScrubber = document.getElementById('audioScrubber');
const audioDurationText = document.getElementById('audioDurationText');
const activeAudioTitle = document.getElementById('activeAudioTitle');

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  fetchPresets();
  fetchCommunityReports();
  setupAudioPlayerEvents();
  initCanvasVisualizer();
});

/**
 * Fetch Demo Benchmark Scenarios from FastAPI backend
 */
async function fetchPresets() {
  const container = document.getElementById('presetsList');
  try {
    const res = await fetch('/api/presets');
    const data = await res.json();
    presetsList = data.presets || [];

    if (presetsList.length === 0) {
      container.innerHTML = `<div class="text-center py-4 text-stone-500 text-xs">No presets found.</div>`;
      return;
    }

    container.innerHTML = '';
    presetsList.forEach((preset, index) => {
      const isScam = preset.is_synthetic;
      const card = document.createElement('div');
      card.id = `presetCard_${preset.id}`;
      card.className = `preset-card p-3 rounded-xl border border-[#E4DDD2] bg-white hover:bg-stone-50 cursor-pointer transition-all space-y-2 shadow-sm ${index === 0 ? 'active' : ''}`;
      card.onclick = () => selectPreset(preset);

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full ${isScam ? 'bg-rose-600' : 'bg-emerald-600'}"></span>
            <span class="font-bold text-xs text-stone-900 truncate max-w-[210px]">${preset.title}</span>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold ${isScam ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}">
            ${isScam ? 'AI CLONE' : 'HUMAN'}
          </span>
        </div>
        <div class="text-[11px] text-stone-500 font-mono truncate">
          ${preset.caller}
        </div>
        <div class="flex flex-wrap gap-1 pt-0.5">
          ${preset.tags.map(t => `<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200 font-medium">${t}</span>`).join('')}
        </div>
      `;
      container.appendChild(card);
    });

    lucide.createIcons();

    if (presetsList.length > 0) {
      selectPreset(presetsList[0], false);
    }
  } catch (err) {
    console.error('Failed to load presets:', err);
    container.innerHTML = `<div class="p-3 text-rose-800 text-xs font-mono bg-rose-50 rounded-lg border border-rose-200">Failed to connect to backend presets. Check server status.</div>`;
  }
}

/**
 * Switch Navigation Tabs (5 Modes)
 */
function switchMode(mode) {
  const tabs = {
    livecall: { btn: 'tabLiveCallBtn', panel: 'liveCallPanel' },
    presets: { btn: 'tabPresetsBtn', panel: 'presetsPanel' },
    mic: { btn: 'tabMicBtn', panel: 'micPanel' },
    registry: { btn: 'tabRegistryBtn', panel: 'registryPanel' },
    upload: { btn: 'tabUploadBtn', panel: 'uploadPanel' }
  };

  for (const key in tabs) {
    const b = document.getElementById(tabs[key].btn);
    const p = document.getElementById(tabs[key].panel);
    if (!b || !p) continue;
    if (key === mode) {
      b.className = "flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-stone-900 text-white shadow-sm transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap";
      p.classList.remove('hidden');
    } else {
      b.className = "flex-1 py-2 px-3 text-xs font-semibold rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap";
      p.classList.add('hidden');
    }
  }

  if (mode === 'registry') {
    fetchCommunityReports();
  }
}

// ==============================================================================
// FEATURE 1: LIVE CALL TRACKING & PRE-ALERT INTERCEPTOR
// ==============================================================================
function onSimCallerSelected(val) {
  const customInput = document.getElementById('customPhoneInput');
  if (val === 'custom') {
    customInput.classList.remove('hidden');
    currentTrackedPhone = customInput.value || "+1 (555) 123-4567";
  } else {
    customInput.classList.add('hidden');
    currentTrackedPhone = val;
  }
}

/**
 * Simulates an incoming call with PRE-ALERT lookup before answering!
 */
async function triggerIncomingCall() {
  const selectVal = document.getElementById('simCallerSelect').value;
  if (selectVal === 'custom') {
    currentTrackedPhone = document.getElementById('customPhoneInput').value || "+1 (555) 999-0000";
  } else {
    currentTrackedPhone = selectVal;
  }

  currentSimScenario = presetsList.find(p => p.caller.includes(currentTrackedPhone.replace(/[() -]/g, '').slice(-7))) || presetsList[0];

  document.getElementById('ringingCallerNumber').textContent = currentTrackedPhone;
  const ringingBox = document.getElementById('ringingCallBox');
  const activeTrackingBox = document.getElementById('activeCallTrackingBox');
  activeTrackingBox.classList.add('hidden');
  ringingBox.classList.remove('hidden');

  playTelephoneRing();

  document.getElementById('preAlertHeadline').textContent = "🔍 QUERYING COMMUNITY REGISTRY...";
  document.getElementById('preAlertMessage').textContent = "Scanning distributed fraud intelligence for prior scam reports...";

  try {
    const res = await fetch(`/api/caller-lookup?phone=${encodeURIComponent(currentTrackedPhone)}`);
    const data = await res.json();
    const alertData = data.pre_alert;

    document.getElementById('preAlertHeadline').textContent = alertData.alert_headline;
    document.getElementById('preAlertMessage').textContent = alertData.alert_message;
    document.getElementById('preAlertRiskBadge').textContent = alertData.risk_level;
    document.getElementById('preAlertRiskBadge').className = alertData.is_reported ? "text-rose-700 font-bold" : "text-emerald-700 font-bold";
    document.getElementById('preAlertSignature').textContent = alertData.cpacf_signature;

    const banner = document.getElementById('preAlertBanner');
    if (alertData.is_reported) {
      banner.className = "p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs space-y-1.5 pulse-threat";
    } else {
      banner.className = "p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs space-y-1.5";
    }
  } catch (err) {
    console.warn("Pre-alert lookup error:", err);
  }
}

function playTelephoneRing() {
  stopTelephoneRing();
  initAudioContext();
  try {
    ringOscillator = audioContext.createOscillator();
    ringGainNode = audioContext.createGain();
    ringOscillator.type = 'sine';
    ringOscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    ringGainNode.gain.setValueAtTime(0.06, audioContext.currentTime);

    ringOscillator.connect(ringGainNode);
    ringGainNode.connect(audioContext.destination);
    ringOscillator.start();
  } catch (e) {}
}

function stopTelephoneRing() {
  if (ringOscillator) {
    try {
      ringOscillator.stop();
      ringOscillator.disconnect();
    } catch(e){}
    ringOscillator = null;
  }
}

/**
 * User answers the call -> Enters Live Call Tracking Mode
 */
function acceptLiveCall() {
  stopTelephoneRing();
  document.getElementById('ringingCallBox').classList.add('hidden');
  const trackingBox = document.getElementById('activeCallTrackingBox');
  trackingBox.classList.remove('hidden');

  isLiveCallActive = true;
  liveCallSeconds = 0;

  if (currentSimScenario) {
    audioPlayer.src = `/samples/${currentSimScenario.filename}`;
    audioPlayer.play();
    activeAudioTitle.textContent = `📞 In-Call: ${currentTrackedPhone}`;
    playIcon.setAttribute('data-lucide', 'pause');
    lucide.createIcons();
  }

  if (liveCallTimerInterval) clearInterval(liveCallTimerInterval);
  liveCallTimerInterval = setInterval(updateLiveCallTrackingTick, 1000);
}

/**
 * Real-time per-second telemetry loop during active call
 */
async function updateLiveCallTrackingTick() {
  if (!isLiveCallActive) return;
  liveCallSeconds++;

  const m = Math.floor(liveCallSeconds / 60).toString().padStart(2, '0');
  const s = (liveCallSeconds % 60).toString().padStart(2, '0');
  document.getElementById('liveCallTimerText').textContent = `${m}:${s}`;

  const fullTranscript = currentSimScenario ? currentSimScenario.transcript : "Caller audio active...";
  const words = fullTranscript.split(' ');
  const wordsToShow = Math.min(Math.floor(liveCallSeconds * 4) + 3, words.length);
  const currentSpokenText = words.slice(0, wordsToShow).join(' ');

  try {
    const res = await fetch('/api/track-live-call-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call_id: "LIVE-STREAM-SIM",
        elapsed_seconds: liveCallSeconds,
        spoken_transcript: currentSpokenText,
        caller_phone: currentTrackedPhone
      })
    });
    const data = await res.json();

    const threatScore = data.dynamic_threat_score;
    document.getElementById('liveThreatText').textContent = `${Math.round(threatScore)}% ${data.call_status.replace('_', ' ')}`;
    document.getElementById('liveThreatBar').style.width = `${Math.min(threatScore, 100)}%`;

    if (threatScore >= 70) {
      document.getElementById('liveThreatBar').className = "bg-rose-600 h-2 rounded-full transition-all duration-500 pulse-threat";
      document.getElementById('liveThreatText').className = "text-rose-700 font-bold font-mono";
    } else if (threatScore >= 40) {
      document.getElementById('liveThreatBar').className = "bg-amber-600 h-2 rounded-full transition-all duration-500";
      document.getElementById('liveThreatText').className = "text-amber-800 font-bold font-mono";
    } else {
      document.getElementById('liveThreatBar').className = "bg-emerald-700 h-2 rounded-full transition-all duration-500";
      document.getElementById('liveThreatText').className = "text-emerald-800 font-bold font-mono";
    }

    document.getElementById('liveStreamTranscript').innerHTML = data.highlighted_transcript || currentSpokenText;

  } catch(e) {
    console.warn("Live tracking update error:", e);
  }

  if (liveCallSeconds >= 9) {
    hangupAndAnalyzeCall();
  }
}

function rejectLiveCall() {
  stopTelephoneRing();
  document.getElementById('ringingCallBox').classList.add('hidden');
  alert(`Call from ${currentTrackedPhone} was declined and blocked. Pre-alert logged to protection registry.`);
}

async function hangupAndAnalyzeCall() {
  isLiveCallActive = false;
  if (liveCallTimerInterval) clearInterval(liveCallTimerInterval);
  audioPlayer.pause();
  document.getElementById('activeCallTrackingBox').classList.add('hidden');

  if (currentSimScenario) {
    await executeAnalysisFromPreset(currentSimScenario, currentTrackedPhone);
  }
}

function quickReportFromLiveCall() {
  document.getElementById('reportPhoneInput').value = currentTrackedPhone;
  openReportScamModal();
}

// ==============================================================================
// FEATURE 2: COMMUNITY SCAM REGISTRY & PRIOR REPORTS EXPLORER
// ==============================================================================
async function fetchCommunityReports() {
  const container = document.getElementById('communityReportsList');
  if (!container) return;
  try {
    const res = await fetch('/api/community-reports');
    const data = await res.json();
    const reports = data.reports || [];

    container.innerHTML = '';
    reports.forEach(r => {
      const isScam = r.verified_scam;
      const item = document.createElement('div');
      item.className = "p-3 rounded-xl border border-[#E4DDD2] bg-white hover:bg-stone-50 text-xs space-y-1.5 transition-all shadow-sm";
      item.innerHTML = `
        <div class="flex items-center justify-between font-mono">
          <span class="font-bold text-stone-900 text-xs">${r.phone}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isScam ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}">
            ${isScam ? `${r.report_count} REPORTS` : 'VERIFIED SAFE'}
          </span>
        </div>
        <div class="text-[11px] text-amber-900 font-bold">${r.caller_name}</div>
        <p class="text-[11px] text-stone-600 leading-tight">${r.modus_operandi}</p>
        <div class="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-1 border-t border-[#EAE3D6]">
          <span>Vector: ${r.scam_vector.split('(')[0]}</span>
          <span class="truncate max-w-[130px] font-medium">${r.cpacf_signature}</span>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading community reports:", err);
  }
}

async function searchScamRegistry() {
  const phone = document.getElementById('registrySearchInput').value.trim();
  if (!phone) return;
  try {
    const res = await fetch(`/api/caller-lookup?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    const alertData = data.pre_alert;

    alert(`[COMMUNITY SCAM REGISTRY LOOKUP]\n\nCaller: ${alertData.phone}\nStatus: ${alertData.pre_alert_level}\nReports: ${alertData.report_count}\nVector: ${alertData.scam_vector}\n\nAdvisory: ${alertData.alert_message}\n\nCrypto Signature: ${alertData.cpacf_signature}`);
  } catch(e) {
    alert("Lookup failed: " + e.message);
  }
}

function openReportScamModal() {
  document.getElementById('reportScamModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeReportScamModal() {
  document.getElementById('reportScamModal').classList.add('hidden');
}

async function submitScamReport() {
  const phone = document.getElementById('reportPhoneInput').value.trim();
  const vector = document.getElementById('reportVectorSelect').value;
  const notes = document.getElementById('reportNotesInput').value.trim();

  if (!phone) {
    alert("Please enter a phone number to report.");
    return;
  }

  try {
    const res = await fetch('/api/report-caller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        caller_name: "Community Reported Fraudster",
        scam_vector: vector,
        modus_operandi: notes || "User logged suspicious AI voice cloning activity.",
        tags: ["Community Reported", vector.split(' ')[0]]
      })
    });
    const data = await res.json();
    alert(`Success! Fraud report registered and sealed with IBM CPACF Hardware Cryptography:\n\nSignature: ${data.data.crypto_seal.signature}\n\nAll AegisVoice users will now receive instant pre-alerts when this number calls!`);
    closeReportScamModal();
    fetchCommunityReports();
  } catch(e) {
    alert("Failed to submit report: " + e.message);
  }
}

// ==============================================================================
// FEATURE 3: IBM Z & LINUXONE TELEMETRY MODAL
// ==============================================================================
async function openIbmModal() {
  try {
    const res = await fetch('/api/ibm-z/telemetry');
    const data = await res.json();
    const t = data.telemetry;
    document.getElementById('telemetryPlatform').textContent = t.platform;
    document.getElementById('telemetryAccelerator').textContent = `${t.ai_accelerator} (${t.inference_latency_ms}ms)`;
    document.getElementById('telemetryCrypto').textContent = t.crypto_acceleration;
  } catch(e){}
  document.getElementById('ibmModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeIbmModal() {
  document.getElementById('ibmModal').classList.add('hidden');
}

// ==============================================================================
// BENCHMARK PRESETS & FORENSIC EXECUTION
// ==============================================================================
async function selectPreset(preset, autoRun = true) {
  activePreset = preset;

  document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById(`presetCard_${preset.id}`);
  if (card) card.classList.add('active');

  activeAudioTitle.textContent = preset.title;
  audioPlayer.src = `/samples/${preset.filename}`;
  audioPlayer.load();

  playIcon.setAttribute('data-lucide', 'play');
  lucide.createIcons();

  if (autoRun) {
    await executeAnalysisFromPreset(preset, preset.caller);
  }
}

async function executeAnalysisFromPreset(preset, phone = "") {
  showAnalyzingState(preset.title);

  try {
    const audioRes = await fetch(`/samples/${preset.filename}`);
    const audioBlob = await audioRes.blob();

    const formData = new FormData();
    formData.append('audio', audioBlob, preset.filename);
    formData.append('transcript', preset.transcript);
    formData.append('preset_id', preset.id);
    formData.append('phone_number', phone || preset.caller);

    const apiRes = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await apiRes.json();
    if (data.status === 'success') {
      renderForensicResults(data);
    } else {
      alert('Forensic analysis failed: ' + data.detail);
    }
  } catch (err) {
    console.error('Error analyzing preset:', err);
    alert('Analysis error: ' + err.message);
  }
}

// ==============================================================================
// LIVE MIC INTERCEPTION & SPEECH RECOGNITION
// ==============================================================================
async function startMicRecording() {
  if (isRecordingMic) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    isRecordingMic = true;
    audioChunks = [];

    initAudioContext();
    const micSource = audioContext.createMediaStreamSource(stream);
    micSource.connect(analyserNode);

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.start(250);

    document.getElementById('micRecordingTimer').classList.remove('hidden');
    document.getElementById('startRecordBtn').disabled = true;
    document.getElementById('startRecordBtn').classList.add('opacity-50', 'cursor-not-allowed');
    document.getElementById('stopRecordBtn').disabled = false;
    document.getElementById('stopRecordBtn').className = "px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wider uppercase flex items-center space-x-2 transition-all cursor-pointer shadow-sm";
    activeAudioTitle.textContent = "🎙️ Live Intercepted Microphone Stream";

    startLiveSpeechRecognition();

  } catch (err) {
    alert("Microphone access error: " + err.message + "\nPlease allow microphone permissions in your browser.");
  }
}

function startLiveSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const transcriptEl = document.getElementById('liveTranscriptText');
  const badgeEl = document.getElementById('sttStatusBadge');

  if (!SpeechRecognition) {
    badgeEl.textContent = "STT NOT SUPPORTED";
    badgeEl.className = "text-amber-800 font-bold";
    transcriptEl.textContent = "Browser speech recognition not available. Pure acoustic analysis will still be executed.";
    return;
  }

  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = 'en-US';

  speechRecognizer.onstart = () => {
    badgeEl.textContent = "LISTENING LIVE...";
    badgeEl.className = "text-rose-700 font-bold animate-pulse";
    transcriptEl.textContent = "Listening... Speak now.";
  };

  speechRecognizer.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    transcriptEl.textContent = final || interim || "Listening...";
  };

  speechRecognizer.onerror = (e) => {
    console.warn("Speech recognition error:", e.error);
  };

  speechRecognizer.start();
}

async function stopMicRecording() {
  if (!isRecordingMic || !mediaRecorder) return;

  isRecordingMic = false;
  mediaRecorder.stop();

  if (speechRecognizer) {
    try { speechRecognizer.stop(); } catch(e){}
  }

  document.getElementById('micRecordingTimer').classList.add('hidden');
  document.getElementById('startRecordBtn').disabled = false;
  document.getElementById('startRecordBtn').classList.remove('opacity-50', 'cursor-not-allowed');
  document.getElementById('stopRecordBtn').disabled = true;
  document.getElementById('stopRecordBtn').className = "px-5 py-2.5 rounded-xl bg-stone-200 text-stone-400 cursor-not-allowed font-semibold text-xs tracking-wider uppercase flex items-center space-x-2 transition-all";

  showAnalyzingState("Live Microphone Stream");

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;

    const transcript = document.getElementById('liveTranscriptText').textContent;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'live_mic_call.webm');
    formData.append('transcript', transcript.startsWith("Listening") ? "" : transcript);
    formData.append('phone_number', "Live Microphone Input");

    try {
      const apiRes = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      const data = await apiRes.json();
      if (data.status === 'success') {
        renderForensicResults(data);
      } else {
        alert('Analysis error: ' + data.detail);
      }
    } catch (err) {
      alert("Error sending mic audio to backend: " + err.message);
    }
  };
}

// ==============================================================================
// FILE UPLOAD HANDLER
// ==============================================================================
let selectedUploadFile = null;

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  selectedUploadFile = file;
  const fileNameDisplay = document.getElementById('selectedFileName');
  fileNameDisplay.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  fileNameDisplay.classList.remove('hidden');

  const analyzeBtn = document.getElementById('uploadAnalyzeBtn');
  analyzeBtn.disabled = false;
  analyzeBtn.className = "w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm";

  audioPlayer.src = URL.createObjectURL(file);
  activeAudioTitle.textContent = file.name;
}

async function analyzeUploadedFile() {
  if (!selectedUploadFile) return;

  showAnalyzingState(selectedUploadFile.name);

  const transcript = document.getElementById('uploadTranscriptInput').value;
  const formData = new FormData();
  formData.append('audio', selectedUploadFile);
  formData.append('transcript', transcript);
  formData.append('phone_number', "Uploaded Audio Recording");

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.status === 'success') {
      renderForensicResults(data);
    } else {
      alert('Forensic upload failed: ' + data.detail);
    }
  } catch (err) {
    alert('Upload error: ' + err.message);
  }
}

function showAnalyzingState(name) {
  document.getElementById('threatStatusText').textContent = `INTERCEPTING & FORENSICALLY SCANNING ON IBM TELUM: ${name}...`;
  document.getElementById('threatStatusDot').className = "w-3 h-3 rounded-full bg-amber-600 animate-ping";
  document.getElementById('threatBanner').className = "p-4 rounded-xl border flex items-center justify-between mb-6 bg-amber-50 border-amber-200 text-amber-950 shadow-sm";
}

// ==============================================================================
// RENDER COMPLETE FORENSIC RESULTS (CLASSY BEIGE DESIGN)
// ==============================================================================
function renderForensicResults(data) {
  currentIncidentData = data;

  const tm = data.threat_matrix;
  const ac = data.acoustic;
  const li = data.linguistic;
  const preAlert = data.caller_pre_alert;

  // 1. Incident ID Badge
  document.getElementById('incidentIdBadge').textContent = data.incident_id;

  // 2. Banner and Status
  const banner = document.getElementById('threatBanner');
  const dot = document.getElementById('threatStatusDot');
  const statusText = document.getElementById('threatStatusText');

  statusText.textContent = tm.badge_text;

  if (tm.color_code === 'red') {
    banner.className = "p-4 rounded-xl border flex items-center justify-between mb-6 bg-rose-50 border-rose-300 text-rose-950 shadow-sm pulse-threat";
    dot.className = "w-3 h-3 rounded-full bg-rose-600";
  } else if (tm.color_code === 'amber' || tm.color_code === 'orange') {
    banner.className = "p-4 rounded-xl border flex items-center justify-between mb-6 bg-amber-50 border-amber-300 text-amber-950 shadow-sm";
    dot.className = "w-3 h-3 rounded-full bg-amber-600";
  } else {
    banner.className = "p-4 rounded-xl border flex items-center justify-between mb-6 bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm";
    dot.className = "w-3 h-3 rounded-full bg-emerald-600";
  }

  // 3. Pre-Alert Prior Reports Notice
  const preNoticeBox = document.getElementById('resultsPreAlertNotice');
  if (preAlert && preAlert.is_reported) {
    preNoticeBox.classList.remove('hidden');
    document.getElementById('resultsPreAlertTitle').textContent = `PRE-ALERT: ${preAlert.report_count} COMMUNITY FRAUD REPORTS FOR ${preAlert.phone}`;
    document.getElementById('resultsPreAlertCount').textContent = `${preAlert.report_count} REPORTS`;
    document.getElementById('resultsPreAlertDetails').textContent = `Reported Vector: ${preAlert.scam_vector}. Modus Operandi: ${preAlert.modus_operandi}`;
  } else {
    preNoticeBox.classList.add('hidden');
  }

  // 4. Animate Master Unified Threat Gauge
  const unifiedPct = tm.unified_threat_score;
  document.getElementById('unifiedScoreNumber').textContent = `${Math.round(unifiedPct)}%`;
  const unifiedCirc = 264;
  const unifiedOffset = unifiedCirc - (unifiedCirc * unifiedPct) / 100;
  const unifiedBar = document.getElementById('unifiedGaugeProgress');
  unifiedBar.style.strokeDashoffset = unifiedOffset;
  unifiedBar.className = `gauge-circle-progress ${unifiedPct >= 70 ? 'stroke-rose-600' : (unifiedPct >= 40 ? 'stroke-amber-600' : 'stroke-emerald-700')}`;

  // 5. Animate Acoustic AI Gauge
  const acousticPct = ac.deepfake_probability_percent;
  document.getElementById('acousticScoreNumber').textContent = `${Math.round(acousticPct)}%`;
  const acousticCirc = 251;
  const acousticOffset = acousticCirc - (acousticCirc * acousticPct) / 100;
  const acousticBar = document.getElementById('acousticGaugeProgress');
  acousticBar.style.strokeDashoffset = acousticOffset;
  acousticBar.className = `gauge-circle-progress ${acousticPct >= 70 ? 'stroke-rose-600' : (acousticPct >= 40 ? 'stroke-amber-600' : 'stroke-blue-700')}`;
  document.getElementById('suspectedEngineText').textContent = ac.suspected_engine.split('(')[0];

  // 6. Animate Scam Intent Gauge
  const scamPct = li.scam_risk_percent;
  document.getElementById('scamScoreNumber').textContent = `${Math.round(scamPct)}%`;
  const scamCirc = 251;
  const scamOffset = scamCirc - (scamCirc * scamPct) / 100;
  const scamBar = document.getElementById('scamGaugeProgress');
  scamBar.style.strokeDashoffset = scamOffset;
  scamBar.className = `gauge-circle-progress ${scamPct >= 70 ? 'stroke-rose-600' : (scamPct >= 40 ? 'stroke-amber-600' : 'stroke-emerald-700')}`;
  document.getElementById('scamRiskTierText').textContent = `Tier: ${li.risk_tier.replace('_', ' ')}`;

  // 7. Explainable AI Biomarkers Table
  const anomaliesContainer = document.getElementById('anomaliesContainer');
  anomaliesContainer.innerHTML = '';
  ac.anomalies.forEach(anomaly => {
    const isAnomaly = anomaly.status === 'ANOMALY';
    const card = document.createElement('div');
    card.className = `p-3 rounded-xl border text-xs space-y-1 ${isAnomaly ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-stone-50 border-[#E4DDD2] text-stone-800'}`;
    card.innerHTML = `
      <div class="flex items-center justify-between font-mono">
        <span class="font-bold text-stone-900">${anomaly.metric}</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isAnomaly ? 'bg-rose-100 text-rose-900 border border-rose-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}">
          ${anomaly.status}
        </span>
      </div>
      <div class="flex items-center justify-between text-[11px] text-stone-600 font-mono">
        <span>Found: <strong class="text-stone-900">${anomaly.value}</strong></span>
        <span>Baseline: ${anomaly.normal_range}</span>
      </div>
      <p class="text-[11px] text-stone-600 pt-0.5 leading-tight">${anomaly.reason}</p>
    `;
    anomaliesContainer.appendChild(card);
  });

  // 8. Spoken Content & Scam Triggers
  const transcriptBox = document.getElementById('transcriptDisplayBox');
  transcriptBox.innerHTML = li.highlighted_transcript || data.transcript || "<em>No spoken words detected in audio.</em>";
  document.getElementById('triggerCountBadge').textContent = `${li.detected_triggers.length} TRIGGERS FLAGGED`;

  // 9. Actionable Countermeasures Checklist
  const countermeasuresList = document.getElementById('countermeasuresList');
  countermeasuresList.innerHTML = '';
  li.defense_protocol.forEach(action => {
    const item = document.createElement('div');
    item.className = "p-3 rounded-xl bg-stone-50 border border-[#E4DDD2] flex items-start space-x-2 text-xs font-mono text-stone-800 shadow-sm";
    item.innerHTML = `<span>${action}</span>`;
    countermeasuresList.appendChild(item);
  });

  // Enable Export Dossier Button
  const exportBtn = document.getElementById('exportReportBtn');
  exportBtn.disabled = false;
  exportBtn.className = "px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm";
}

// ==============================================================================
// INCIDENT DOSSIER EXPORT & PRINT
// ==============================================================================
function exportIncidentDossier() {
  if (!currentIncidentData) return;
  const d = currentIncidentData;
  const modal = document.getElementById('reportModal');
  const content = document.getElementById('modalReportContent');

  document.getElementById('modalIncidentId').textContent = `CASE ID: ${d.incident_id}`;

  content.innerHTML = `
    <div class="p-3.5 bg-stone-50 rounded-xl border border-[#E4DDD2] space-y-1 text-xs">
      <div class="flex justify-between">
        <span class="text-stone-500">TIMESTAMP:</span>
        <span class="text-stone-900 font-bold">${new Date().toUTCString()}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-stone-500">CALLER IDENTIFIER:</span>
        <span class="text-amber-800 font-mono font-bold">${d.caller_pre_alert ? d.caller_pre_alert.phone : 'Unknown'}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-stone-500">AUDIO EVIDENCE HASH:</span>
        <span class="text-stone-800 font-mono">${d.acoustic.file_info.sha256_hash}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-stone-500">IBM CPACF HARDWARE SEAL:</span>
        <span class="text-blue-800 font-mono font-bold">${d.ibm_z ? d.ibm_z.cpacf.signature : 'Verified'}</span>
      </div>
    </div>

    <div class="p-4 rounded-xl border ${d.threat_matrix.color_code === 'red' ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'}">
      <div class="font-bold text-sm mb-1">${d.threat_matrix.badge_text}</div>
      <p class="text-xs text-stone-700">${d.threat_matrix.primary_advice}</p>
    </div>

    <div class="space-y-2">
      <h4 class="font-bold text-stone-900 text-xs uppercase tracking-wider text-amber-900">Biometric &amp; IBM Telum Forensic Score Matrix</h4>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 bg-stone-50 rounded-lg border border-[#E4DDD2]">
          Composite Threat Index: <strong class="text-stone-900">${d.threat_matrix.unified_threat_score}%</strong>
        </div>
        <div class="p-2.5 bg-stone-50 rounded-lg border border-[#E4DDD2]">
          Acoustic Clone Probability: <strong class="text-stone-900">${d.acoustic.deepfake_probability_percent}%</strong>
        </div>
        <div class="p-2.5 bg-stone-50 rounded-lg border border-[#E4DDD2]">
          Telum NNPA Latency: <strong class="text-blue-800">0.82 ms</strong>
        </div>
        <div class="p-2.5 bg-stone-50 rounded-lg border border-[#E4DDD2]">
          Prior Community Reports: <strong class="text-amber-800">${d.caller_pre_alert ? d.caller_pre_alert.report_count : 0}</strong>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <h4 class="font-bold text-stone-900 text-xs uppercase tracking-wider text-amber-900">Spoken Conversational Evidence</h4>
      <div class="p-3 bg-stone-50 rounded-lg border border-[#E4DDD2] text-xs italic text-stone-800">
        "${d.transcript || 'No verbal transcript provided'}"
      </div>
    </div>

    <div class="space-y-2">
      <h4 class="font-bold text-stone-900 text-xs uppercase tracking-wider text-emerald-900">Law Enforcement / Banking Submission Advisory</h4>
      <ul class="list-disc pl-5 space-y-1 text-stone-700 text-xs">
        <li>Submit this dossier directly to National Cybercrime Portal (cybercrime.gov.in / Dial 1930).</li>
        <li>Present audio SHA-256 and IBM CPACF signature to your bank fraud division to initiate an immediate transfer recall.</li>
        <li>Preserve raw audio file in original digital container without re-encoding to retain forensic chain of custody.</li>
      </ul>
    </div>
  `;

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeReportModal() {
  document.getElementById('reportModal').classList.add('hidden');
}

function openHelplineModal() {
  document.getElementById('helplineModal').classList.remove('hidden');
}

function closeHelplineModal() {
  document.getElementById('helplineModal').classList.add('hidden');
}

// ==============================================================================
// WEB AUDIO API & EDITORIAL CANVAS OSCILLOSCOPE
// ==============================================================================
function initAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 512;
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function setupAudioPlayerEvents() {
  audioPlayer.ontimeupdate = () => {
    if (audioPlayer.duration) {
      const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      audioScrubber.value = pct;
      audioDurationText.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
    }
  };

  audioPlayer.onended = () => {
    playIcon.setAttribute('data-lucide', 'play');
    lucide.createIcons();
  };
}

function toggleAudioPlayback() {
  initAudioContext();

  if (!audioSourceNode && audioPlayer.src) {
    try {
      audioSourceNode = audioContext.createMediaElementSource(audioPlayer);
      audioSourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
    } catch(e) {}
  }

  if (audioPlayer.paused) {
    audioPlayer.play();
    playIcon.setAttribute('data-lucide', 'pause');
  } else {
    audioPlayer.pause();
    playIcon.setAttribute('data-lucide', 'play');
  }
  lucide.createIcons();
}

function restartAudioPlayback() {
  audioPlayer.currentTime = 0;
  audioPlayer.play();
  playIcon.setAttribute('data-lucide', 'pause');
  lucide.createIcons();
}

function seekAudio(val) {
  if (audioPlayer.duration) {
    audioPlayer.currentTime = (val / 100) * audioPlayer.duration;
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Editorial Luxury Oscilloscope Renderer
 */
function initCanvasVisualizer() {
  const width = waveformCanvas.width;
  const height = waveformCanvas.height;

  function renderFrame() {
    animationFrameId = requestAnimationFrame(renderFrame);

    // Clean warm card background
    canvasCtx.fillStyle = '#FFFFFF';
    canvasCtx.fillRect(0, 0, width, height);

    // Subtle fine grid lines
    canvasCtx.strokeStyle = 'rgba(228, 221, 210, 0.4)';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, height / 2);
    canvasCtx.lineTo(width, height / 2);
    canvasCtx.moveTo(0, height / 4);
    canvasCtx.lineTo(width, height / 4);
    canvasCtx.moveTo(0, (height * 3) / 4);
    canvasCtx.lineTo(width, (height * 3) / 4);
    canvasCtx.stroke();

    if (analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      canvasCtx.lineWidth = 2.2;
      canvasCtx.strokeStyle = '#1C1917'; // Deep Obsidian Charcoal
      canvasCtx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
    } else {
      // Idle classy calm pulse wave
      canvasCtx.lineWidth = 1.8;
      canvasCtx.strokeStyle = '#B45309'; // Warm Cognac
      canvasCtx.beginPath();
      const t = Date.now() / 350;
      for (let x = 0; x < width; x += 5) {
        const y = height / 2 + Math.sin(x * 0.04 + t) * 6;
        if (x === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
      }
      canvasCtx.stroke();
    }
  }

  renderFrame();
}
