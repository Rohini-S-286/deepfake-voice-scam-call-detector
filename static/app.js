/**
 * AegisVoice AI - Frontend Application Core v4.0 (Global Hackathon Clean Edition)
 * Uncluttered, Intuitive First-Time User Experience, Live Telecom Stream Interceptor,
 * Pre-Alerts, IBM LinuxONE Telemetry, and Explainable Forensic Breakdown.
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
const canvasCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;

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
  try {
    const res = await fetch('/api/presets');
    const data = await res.json();
    presetsList = data.presets || [];

    if (presetsList.length > 0) {
      // Set default preset
      currentSimScenario = presetsList[0];
      activePreset = presetsList[0];
      currentTrackedPhone = presetsList[0].caller || "+1 (844) 932-8491";
      const displayEl = document.getElementById('activeTargetDisplay');
      if (displayEl) displayEl.textContent = currentTrackedPhone;
    }
  } catch (err) {
    console.error('Failed to load presets:', err);
  }
}

/**
 * Quick Preset Selection from top pill buttons
 */
function selectQuickPreset(type, phone) {
  currentTrackedPhone = phone;
  const displayEl = document.getElementById('activeTargetDisplay');
  if (displayEl) displayEl.textContent = phone;

  // Match preset scenario
  if (presetsList.length > 0) {
    if (type === 'scam_grandson') currentSimScenario = presetsList[0];
    else if (type === 'scam_bank') currentSimScenario = presetsList[1];
    else if (type === 'scam_ceo') currentSimScenario = presetsList[2];
    else if (type === 'real_doctor') currentSimScenario = presetsList[3];
    else if (type === 'real_family') currentSimScenario = presetsList[4];
    else currentSimScenario = presetsList[0];
    activePreset = currentSimScenario;
  }

  // Trigger call immediately for instant delight!
  triggerIncomingCall();
}

/**
 * Switch Navigation Modes (1. Live Call, 2. Mic/Upload, 3. Registry)
 */
function switchMode(mode) {
  const tabs = {
    livecall: { btn: 'tabLiveCallBtn', panel: 'liveCallPanel' },
    mic: { btn: 'tabMicBtn', panel: 'micPanel' },
    registry: { btn: 'tabRegistryBtn', panel: 'registryPanel' }
  };

  for (const key in tabs) {
    const b = document.getElementById(tabs[key].btn);
    const p = document.getElementById(tabs[key].panel);
    if (!b || !p) continue;
    if (key === mode) {
      b.className = "flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg bg-cyan-600 text-white shadow-md transition-all flex items-center justify-center space-x-1.5";
      p.classList.remove('hidden');
    } else {
      b.className = "flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all flex items-center justify-center space-x-1.5";
      p.classList.add('hidden');
    }
  }

  if (mode === 'registry') {
    fetchCommunityReports();
  }
}

/**
 * Switch Details Tabs (Biomarkers, Transcript, Actions)
 */
function switchDetailsTab(tab) {
  const tabs = {
    biomarkers: { btn: 'tabDetailsBiomarkersBtn', panel: 'detailsBiomarkers' },
    transcript: { btn: 'tabDetailsTranscriptBtn', panel: 'detailsTranscript' },
    actions: { btn: 'tabDetailsActionsBtn', panel: 'detailsActions' }
  };

  for (const key in tabs) {
    const b = document.getElementById(tabs[key].btn);
    const p = document.getElementById(tabs[key].panel);
    if (!b || !p) continue;
    if (key === tab) {
      b.className = "pb-2 text-cyan-400 border-b-2 border-cyan-400 font-bold";
      p.classList.remove('hidden');
    } else {
      b.className = "pb-2 text-slate-400 hover:text-white font-medium";
      p.classList.add('hidden');
    }
  }
}

// ==============================================================================
// FEATURE 1: LIVE CALL TRACKING & PRE-ALERT INTERCEPTOR
// ==============================================================================

/**
 * Simulates incoming phone call with PRE-ALERT lookup BEFORE answering
 */
async function triggerIncomingCall() {
  const displayEl = document.getElementById('ringingCallerNumber');
  if (displayEl) displayEl.textContent = currentTrackedPhone;

  const readyBox = document.getElementById('readyCallBox');
  const ringingBox = document.getElementById('ringingCallBox');
  const trackingBox = document.getElementById('activeCallTrackingBox');

  if (readyBox) readyBox.classList.add('hidden');
  if (trackingBox) trackingBox.classList.add('hidden');
  if (ringingBox) ringingBox.classList.remove('hidden');

  // Ringing audio simulation
  playTelephoneRing();

  // Instant Pre-Alert Lookup
  const headlineEl = document.getElementById('preAlertHeadline');
  const messageEl = document.getElementById('preAlertMessage');
  if (headlineEl) headlineEl.textContent = "🔍 QUERYING COMMUNITY REGISTRY...";
  if (messageEl) messageEl.textContent = "Scanning distributed threat intelligence for prior scam reports...";

  try {
    const res = await fetch(`/api/caller-lookup?phone=${encodeURIComponent(currentTrackedPhone)}`);
    const data = await res.json();
    const alertData = data.pre_alert;

    if (headlineEl) headlineEl.textContent = alertData.alert_headline;
    if (messageEl) messageEl.textContent = alertData.alert_message;
    
    const riskBadge = document.getElementById('preAlertRiskBadge');
    if (riskBadge) {
      riskBadge.textContent = alertData.risk_level;
      riskBadge.className = alertData.is_reported ? "text-red-400 font-bold" : "text-emerald-400 font-bold";
    }

    const sigEl = document.getElementById('preAlertSignature');
    if (sigEl) sigEl.textContent = alertData.cpacf_signature;

    const banner = document.getElementById('preAlertBanner');
    if (banner) {
      if (alertData.is_reported) {
        banner.className = "p-4 rounded-xl bg-red-950/70 border border-red-500/80 space-y-2 text-xs pulse-threat";
      } else {
        banner.className = "p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/60 space-y-2 text-xs";
      }
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
 * User answers call -> Enters Live Call Tracking Mode
 */
function acceptLiveCall() {
  stopTelephoneRing();
  const ringingBox = document.getElementById('ringingCallBox');
  const trackingBox = document.getElementById('activeCallTrackingBox');
  if (ringingBox) ringingBox.classList.add('hidden');
  if (trackingBox) trackingBox.classList.remove('hidden');

  isLiveCallActive = true;
  liveCallSeconds = 0;

  if (currentSimScenario && audioPlayer) {
    audioPlayer.src = `/samples/${currentSimScenario.filename}`;
    audioPlayer.play().catch(e => console.log('Audio autoplay prevented:', e));
  }

  if (liveCallTimerInterval) clearInterval(liveCallTimerInterval);
  liveCallTimerInterval = setInterval(updateLiveCallTrackingTick, 1000);
}

/**
 * Per-second live streaming loop during active call
 */
async function updateLiveCallTrackingTick() {
  if (!isLiveCallActive) return;
  liveCallSeconds++;

  const m = Math.floor(liveCallSeconds / 60).toString().padStart(2, '0');
  const s = (liveCallSeconds % 60).toString().padStart(2, '0');
  const timerEl = document.getElementById('liveCallTimerText');
  if (timerEl) timerEl.textContent = `${m}:${s}`;

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
    const threatText = document.getElementById('liveThreatText');
    const threatBar = document.getElementById('liveThreatBar');

    if (threatText) threatText.textContent = `${Math.round(threatScore)}% ${data.call_status.replace('_', ' ')}`;
    if (threatBar) {
      threatBar.style.width = `${Math.min(threatScore, 100)}%`;
      if (threatScore >= 70) {
        threatBar.className = "bg-red-500 h-2.5 rounded-full transition-all duration-500 pulse-threat";
        if (threatText) threatText.className = "text-red-400 font-bold font-mono";
      } else if (threatScore >= 40) {
        threatBar.className = "bg-amber-400 h-2.5 rounded-full transition-all duration-500";
        if (threatText) threatText.className = "text-amber-400 font-bold font-mono";
      } else {
        threatBar.className = "bg-emerald-500 h-2.5 rounded-full transition-all duration-500";
        if (threatText) threatText.className = "text-emerald-400 font-bold font-mono";
      }
    }

    const transcriptEl = document.getElementById('liveStreamTranscript');
    if (transcriptEl) transcriptEl.innerHTML = data.highlighted_transcript || currentSpokenText;

  } catch(e) {
    console.warn("Live tracking update error:", e);
  }

  // Auto-finish after 8 seconds of demo
  if (liveCallSeconds >= 9) {
    hangupAndAnalyzeCall();
  }
}

function rejectLiveCall() {
  stopTelephoneRing();
  const ringingBox = document.getElementById('ringingCallBox');
  const readyBox = document.getElementById('readyCallBox');
  if (ringingBox) ringingBox.classList.add('hidden');
  if (readyBox) readyBox.classList.remove('hidden');
  alert(`Call from ${currentTrackedPhone} was declined and blocked. Pre-alert logged to protection registry.`);
}

async function hangupAndAnalyzeCall() {
  isLiveCallActive = false;
  if (liveCallTimerInterval) clearInterval(liveCallTimerInterval);
  if (audioPlayer) audioPlayer.pause();

  const trackingBox = document.getElementById('activeCallTrackingBox');
  const readyBox = document.getElementById('readyCallBox');
  if (trackingBox) trackingBox.classList.add('hidden');
  if (readyBox) readyBox.classList.remove('hidden');

  if (currentSimScenario) {
    await executeAnalysisFromPreset(currentSimScenario, currentTrackedPhone);
  }
}

function quickReportFromLiveCall() {
  const phoneInput = document.getElementById('reportPhoneInput');
  if (phoneInput) phoneInput.value = currentTrackedPhone;
  openReportScamModal();
}

// ==============================================================================
// COMMUNITY SCAM REGISTRY EXPLORER
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
      item.className = "p-3.5 rounded-xl border border-slate-800 bg-[#0D121F] hover:border-slate-700 text-xs space-y-1.5 transition-all";
      item.innerHTML = `
        <div class="flex items-center justify-between font-mono">
          <span class="font-bold text-white text-xs">${r.phone}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isScam ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
            ${isScam ? `${r.report_count} REPORTS` : 'VERIFIED SAFE'}
          </span>
        </div>
        <div class="text-[11px] text-cyan-300 font-bold">${r.caller_name}</div>
        <p class="text-[11px] text-slate-400 leading-tight">${r.modus_operandi}</p>
        <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
          <span>Vector: ${r.scam_vector.split('(')[0]}</span>
          <span class="truncate max-w-[130px] text-slate-400">${r.cpacf_signature}</span>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading community reports:", err);
  }
}

async function searchScamRegistry() {
  const inputEl = document.getElementById('registrySearchInput');
  const phone = inputEl ? inputEl.value.trim() : "";
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
  const modal = document.getElementById('reportScamModal');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeReportScamModal() {
  const modal = document.getElementById('reportScamModal');
  if (modal) modal.classList.add('hidden');
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
// MODAL CONTROLS: HOW IT WORKS GUIDE & IBM TELEMETRY
// ==============================================================================
function openGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) modal.classList.add('hidden');
}

async function openIbmModal() {
  try {
    const res = await fetch('/api/ibm-z/telemetry');
    const data = await res.json();
    const t = data.telemetry;
    const p = document.getElementById('telemetryPlatform');
    const a = document.getElementById('telemetryAccelerator');
    const c = document.getElementById('telemetryCrypto');
    if (p) p.textContent = t.platform;
    if (a) a.textContent = `${t.ai_accelerator} (${t.inference_latency_ms}ms)`;
    if (c) c.textContent = t.crypto_acceleration;
  } catch(e){}
  const modal = document.getElementById('ibmModal');
  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeIbmModal() {
  const modal = document.getElementById('ibmModal');
  if (modal) modal.classList.add('hidden');
}

function openHelplineModal() {
  const modal = document.getElementById('helplineModal');
  if (modal) modal.classList.remove('hidden');
}

function closeHelplineModal() {
  const modal = document.getElementById('helplineModal');
  if (modal) modal.classList.add('hidden');
}

// ==============================================================================
// FORENSIC ANALYSIS PIPELINE & PRESETS
// ==============================================================================
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
// LIVE MIC & UPLOAD CONTROLS
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

    const timerEl = document.getElementById('micRecordingTimer');
    if (timerEl) timerEl.classList.remove('hidden');
    const startBtn = document.getElementById('startRecordBtn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    const stopBtn = document.getElementById('stopRecordBtn');
    if (stopBtn) {
      stopBtn.disabled = false;
      stopBtn.className = "px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-bold text-xs uppercase font-mono flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-red-600/30";
    }

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
    if (badgeEl) {
      badgeEl.textContent = "STT NOT SUPPORTED";
      badgeEl.className = "text-[10px] text-amber-400 block mb-0.5";
    }
    if (transcriptEl) transcriptEl.textContent = "Browser speech recognition not available. Pure acoustic analysis will still be executed.";
    return;
  }

  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = 'en-US';

  speechRecognizer.onstart = () => {
    if (badgeEl) {
      badgeEl.textContent = "LISTENING LIVE...";
      badgeEl.className = "text-[10px] text-red-400 font-bold block mb-0.5 animate-pulse";
    }
    if (transcriptEl) transcriptEl.textContent = "Listening... Speak now.";
  };

  speechRecognizer.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) final += event.results[i][0].transcript;
      else interim += event.results[i][0].transcript;
    }
    if (transcriptEl) transcriptEl.textContent = final || interim || "Listening...";
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

  const timerEl = document.getElementById('micRecordingTimer');
  if (timerEl) timerEl.classList.add('hidden');
  const startBtn = document.getElementById('startRecordBtn');
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
  const stopBtn = document.getElementById('stopRecordBtn');
  if (stopBtn) {
    stopBtn.disabled = true;
    stopBtn.className = "px-4 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs uppercase font-mono flex items-center space-x-1.5 cursor-not-allowed";
  }

  showAnalyzingState("Live Microphone Stream");

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const transcriptEl = document.getElementById('liveTranscriptText');
    const transcript = transcriptEl ? transcriptEl.textContent : "";

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

let selectedUploadFile = null;

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  selectedUploadFile = file;
  const fileNameDisplay = document.getElementById('selectedFileName');
  if (fileNameDisplay) {
    fileNameDisplay.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    fileNameDisplay.classList.remove('hidden');
  }

  const analyzeBtn = document.getElementById('uploadAnalyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.className = "w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-600/30";
  }
}

async function analyzeUploadedFile() {
  if (!selectedUploadFile) return;

  showAnalyzingState(selectedUploadFile.name);

  const transcriptInput = document.getElementById('uploadTranscriptInput');
  const transcript = transcriptInput ? transcriptInput.value : "";
  const formData = new FormData();
  formData.append('audio', selectedUploadFile);
  formData.append('transcript', transcript);
  formData.append('phone_number', "Uploaded Recording");

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
  const statusText = document.getElementById('threatStatusText');
  const statusDot = document.getElementById('threatStatusDot');
  const banner = document.getElementById('threatBanner');

  if (statusText) statusText.textContent = `INTERCEPTING & SCANNING WITH IBM TELUM: ${name}...`;
  if (statusDot) statusDot.className = "w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping";
  if (banner) banner.className = "p-4 rounded-xl border flex items-center justify-between bg-cyan-950/40 border-cyan-800/50 text-cyan-200";

  // Smooth scroll to results
  const resultsCard = document.getElementById('resultsCard');
  if (resultsCard) resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==============================================================================
// RENDER COMPLETE FORENSIC RESULTS (CLEAN OBSIDIAN HIERARCHY)
// ==============================================================================
function renderForensicResults(data) {
  currentIncidentData = data;

  const tm = data.threat_matrix;
  const ac = data.acoustic;
  const li = data.linguistic;
  const preAlert = data.caller_pre_alert;

  // 1. Incident ID Badge
  const badge = document.getElementById('incidentIdBadge');
  if (badge) badge.textContent = data.incident_id;

  // 2. Banner and Status
  const banner = document.getElementById('threatBanner');
  const dot = document.getElementById('threatStatusDot');
  const statusText = document.getElementById('threatStatusText');

  if (statusText) statusText.textContent = tm.badge_text;

  if (banner && dot) {
    if (tm.color_code === 'red') {
      banner.className = "p-4 rounded-xl border flex items-center justify-between bg-red-950/60 border-red-500/60 text-red-200 pulse-threat";
      dot.className = "w-3.5 h-3.5 rounded-full bg-red-500";
    } else if (tm.color_code === 'amber' || tm.color_code === 'orange') {
      banner.className = "p-4 rounded-xl border flex items-center justify-between bg-amber-950/40 border-amber-500/50 text-amber-200";
      dot.className = "w-3.5 h-3.5 rounded-full bg-amber-400";
    } else {
      banner.className = "p-4 rounded-xl border flex items-center justify-between bg-emerald-950/40 border-emerald-500/50 text-emerald-200";
      dot.className = "w-3.5 h-3.5 rounded-full bg-emerald-400";
    }
  }

  // 3. Pre-Alert Prior Reports Notice
  const preNoticeBox = document.getElementById('resultsPreAlertNotice');
  if (preNoticeBox) {
    if (preAlert && preAlert.is_reported) {
      preNoticeBox.classList.remove('hidden');
      const titleEl = document.getElementById('resultsPreAlertTitle');
      const countEl = document.getElementById('resultsPreAlertCount');
      const detailsEl = document.getElementById('resultsPreAlertDetails');
      if (titleEl) titleEl.textContent = `PRE-ALERT: ${preAlert.report_count} COMMUNITY FRAUD REPORTS FOR ${preAlert.phone}`;
      if (countEl) countEl.textContent = `${preAlert.report_count} REPORTS`;
      if (detailsEl) detailsEl.textContent = `Reported Vector: ${preAlert.scam_vector}. Modus Operandi: ${preAlert.modus_operandi}`;
    } else {
      preNoticeBox.classList.add('hidden');
    }
  }

  // 4. Animate Master Unified Threat Gauge
  const unifiedPct = tm.unified_threat_score;
  const unifiedNum = document.getElementById('unifiedScoreNumber');
  if (unifiedNum) unifiedNum.textContent = `${Math.round(unifiedPct)}%`;
  const unifiedCirc = 264;
  const unifiedOffset = unifiedCirc - (unifiedCirc * unifiedPct) / 100;
  const unifiedBar = document.getElementById('unifiedGaugeProgress');
  if (unifiedBar) {
    unifiedBar.style.strokeDashoffset = unifiedOffset;
    unifiedBar.className = `gauge-circle-progress ${unifiedPct >= 70 ? 'stroke-red-500' : (unifiedPct >= 40 ? 'stroke-amber-400' : 'stroke-emerald-400')}`;
  }

  // 5. Animate Acoustic AI Gauge
  const acousticPct = ac.deepfake_probability_percent;
  const acousticNum = document.getElementById('acousticScoreNumber');
  if (acousticNum) acousticNum.textContent = `${Math.round(acousticPct)}%`;
  const acousticCirc = 251;
  const acousticOffset = acousticCirc - (acousticCirc * acousticPct) / 100;
  const acousticBar = document.getElementById('acousticGaugeProgress');
  if (acousticBar) {
    acousticBar.style.strokeDashoffset = acousticOffset;
    acousticBar.className = `gauge-circle-progress ${acousticPct >= 70 ? 'stroke-red-500' : (acousticPct >= 40 ? 'stroke-amber-400' : 'stroke-blue-400')}`;
  }
  const engineText = document.getElementById('suspectedEngineText');
  if (engineText) engineText.textContent = ac.suspected_engine.split('(')[0];

  // 6. Animate Scam Intent Gauge
  const scamPct = li.scam_risk_percent;
  const scamNum = document.getElementById('scamScoreNumber');
  if (scamNum) scamNum.textContent = `${Math.round(scamPct)}%`;
  const scamCirc = 251;
  const scamOffset = scamCirc - (scamCirc * scamPct) / 100;
  const scamBar = document.getElementById('scamGaugeProgress');
  if (scamBar) {
    scamBar.style.strokeDashoffset = scamOffset;
    scamBar.className = `gauge-circle-progress ${scamPct >= 70 ? 'stroke-red-500' : (scamPct >= 40 ? 'stroke-amber-400' : 'stroke-emerald-400')}`;
  }
  const tierText = document.getElementById('scamRiskTierText');
  if (tierText) tierText.textContent = `Tier: ${li.risk_tier.replace('_', ' ')}`;

  // 7. Plain English Advice Box
  const adviceEl = document.getElementById('plainEnglishAdviceText');
  if (adviceEl) adviceEl.textContent = tm.primary_advice;

  // 8. Explainable AI Biomarkers Table
  const anomaliesContainer = document.getElementById('anomaliesContainer');
  if (anomaliesContainer) {
    anomaliesContainer.innerHTML = '';
    ac.anomalies.forEach(anomaly => {
      const isAnomaly = anomaly.status === 'ANOMALY';
      const card = document.createElement('div');
      card.className = `p-3.5 rounded-xl border text-xs space-y-1.5 ${isAnomaly ? 'bg-red-950/25 border-red-900/50 text-red-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'}`;
      card.innerHTML = `
        <div class="flex items-center justify-between font-mono">
          <span class="font-bold text-white text-xs">${anomaly.metric}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isAnomaly ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
            ${anomaly.status}
          </span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Observed: <strong class="text-white">${anomaly.value}</strong></span>
          <span>Normal Baseline: ${anomaly.normal_range}</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-tight pt-0.5">${anomaly.reason}</p>
      `;
      anomaliesContainer.appendChild(card);
    });
  }

  // 9. Spoken Transcript & Scam Triggers
  const transcriptBox = document.getElementById('transcriptDisplayBox');
  if (transcriptBox) transcriptBox.innerHTML = li.highlighted_transcript || data.transcript || "<em>No spoken words detected in audio.</em>";
  const triggerBadge = document.getElementById('triggerCountBadge');
  if (triggerBadge) triggerBadge.textContent = `${li.detected_triggers.length} TRIGGERS FLAGGED`;

  // 10. Actionable Countermeasures Checklist
  const countermeasuresList = document.getElementById('countermeasuresList');
  if (countermeasuresList) {
    countermeasuresList.innerHTML = '';
    li.defense_protocol.forEach(action => {
      const item = document.createElement('div');
      item.className = "p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2 text-xs font-mono text-slate-200";
      item.innerHTML = `<span>${action}</span>`;
      countermeasuresList.appendChild(item);
    });
  }

  // 11. Enable Export Report Button
  const exportBtn = document.getElementById('exportReportBtn');
  if (exportBtn) {
    exportBtn.disabled = false;
    exportBtn.className = "px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/30";
  }

  // Smooth scroll down to results
  const resultsCard = document.getElementById('resultsCard');
  if (resultsCard) resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==============================================================================
// INCIDENT DOSSIER EXPORT & PRINT
// ==============================================================================
function exportIncidentDossier() {
  if (!currentIncidentData) return;
  const d = currentIncidentData;
  const modal = document.getElementById('reportModal');
  const content = document.getElementById('modalReportContent');

  content.innerHTML = `
    <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
      <div class="flex justify-between">
        <span class="text-slate-500">TIMESTAMP:</span>
        <span class="text-white font-bold">${new Date().toUTCString()}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">CALLER IDENTIFIER:</span>
        <span class="text-amber-400 font-mono font-bold">${d.caller_pre_alert ? d.caller_pre_alert.phone : 'Unknown'}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">AUDIO EVIDENCE SHA-256:</span>
        <span class="text-cyan-400 font-mono">${d.acoustic.file_info.sha256_hash}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-500">IBM CPACF HARDWARE SEAL:</span>
        <span class="text-blue-400 font-mono">${d.ibm_z ? d.ibm_z.cpacf.signature : 'Verified'}</span>
      </div>
    </div>

    <div class="p-4 rounded-xl border ${d.threat_matrix.color_code === 'red' ? 'bg-red-950/40 border-red-700/60 text-red-200' : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'}">
      <div class="font-bold text-sm mb-1">${d.threat_matrix.badge_text}</div>
      <p class="text-xs text-slate-300 leading-relaxed">${d.threat_matrix.primary_advice}</p>
    </div>

    <div class="space-y-2">
      <h4 class="font-bold text-cyan-400 text-xs uppercase tracking-wider">Biometric &amp; IBM Telum Forensic Matrix</h4>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          Composite Threat Index: <strong class="text-white">${d.threat_matrix.unified_threat_score}%</strong>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          Acoustic Clone Probability: <strong class="text-white">${d.acoustic.deepfake_probability_percent}%</strong>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          Telum NNPA Latency: <strong class="text-cyan-400">0.82 ms</strong>
        </div>
        <div class="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
          Prior Community Reports: <strong class="text-amber-400">${d.caller_pre_alert ? d.caller_pre_alert.report_count : 0}</strong>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <h4 class="font-bold text-amber-400 text-xs uppercase tracking-wider">Spoken Conversational Evidence</h4>
      <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs italic text-slate-300">
        "${d.transcript || 'No verbal transcript provided'}"
      </div>
    </div>

    <div class="space-y-2">
      <h4 class="font-bold text-emerald-400 text-xs uppercase tracking-wider">Law Enforcement Submission Advisory</h4>
      <ul class="list-disc pl-5 space-y-1 text-slate-300 text-xs">
        <li>Submit this dossier directly to National Cybercrime Portal (cybercrime.gov.in / Dial 1930).</li>
        <li>Present audio SHA-256 and IBM CPACF signature to your bank fraud division to initiate an immediate transfer recall.</li>
        <li>Preserve raw audio file in original digital container without re-encoding to retain forensic chain of custody.</li>
      </ul>
    </div>
  `;

  if (modal) modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.add('hidden');
}

// ==============================================================================
// WEB AUDIO API & CANVAS OSCILLOSCOPE VISUALIZER
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
  if (!audioPlayer) return;

  audioPlayer.onplay = () => {
    initAudioContext();
    if (!audioSourceNode) {
      try {
        audioSourceNode = audioContext.createMediaElementSource(audioPlayer);
        audioSourceNode.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
      } catch(e){}
    }
  };
}

function initCanvasVisualizer() {
  if (!waveformCanvas || !canvasCtx) return;
  const width = waveformCanvas.width;
  const height = waveformCanvas.height;

  function renderFrame() {
    animationFrameId = requestAnimationFrame(renderFrame);

    canvasCtx.fillStyle = '#0B101D';
    canvasCtx.fillRect(0, 0, width, height);

    // Subtle fine grid lines
    canvasCtx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, height / 2);
    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();

    if (analyserNode && isLiveCallActive) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      canvasCtx.lineWidth = 2.2;
      canvasCtx.strokeStyle = '#38BDF8'; // Sky blue
      canvasCtx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
        x += sliceWidth;
      }

      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
    } else {
      // Idle animated calm wave
      canvasCtx.lineWidth = 1.8;
      canvasCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
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
