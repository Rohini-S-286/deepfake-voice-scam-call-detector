"""
AegisVoice AI - Deepfake Voice Scam Call Detector & Interceptor
Full-Stack FastAPI Application Backend with IBM Z & LinuxONE Enterprise Acceleration
"""

import os
import uuid
import datetime
import uvicorn
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ml_engine.acoustic_forensics import VoiceForensicsEngine
from ml_engine.scam_intent_analyzer import ScamIntentAnalyzer
from ml_engine.synthetic_generator import generate_preset_library
from ml_engine.ibm_z_engine import ibm_z_engine
from ml_engine.scam_registry import community_registry

app = FastAPI(
    title="AegisVoice AI - Enterprise Deepfake Voice Scam Call Interceptor",
    description="Multi-Modal Forensic AI for Real-Time Spoofed Voice Call Interception on IBM LinuxONE",
    version="3.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Disable caching for instant UI updates during development
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Initialize ML, Forensic, & IBM Z Engines
forensics_engine = VoiceForensicsEngine()
scam_analyzer = ScamIntentAnalyzer()

# Ensure directories exist
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(SAMPLES_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Generate demo presets on startup if not present
presets_list = generate_preset_library(SAMPLES_DIR)

# Mount static and sample file routes
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/samples", StaticFiles(directory=SAMPLES_DIR), name="samples")

# In-memory store for generated forensic reports
incident_reports = {}

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(
                content=f.read(),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
    return "<h1>AegisVoice AI</h1><p>Static frontend is loading...</p>"

@app.get("/api/presets")
async def get_presets():
    """Returns available test cases with pre-recorded audio and metadata."""
    return {
        "status": "success",
        "total": len(presets_list),
        "presets": presets_list
    }

# ==============================================================================
# FEATURE 1: IBM Z & LINUXONE ENTERPRISE TELEMETRY
# ==============================================================================
@app.get("/api/ibm-z/telemetry")
async def get_ibm_z_telemetry():
    """Returns real-time IBM LinuxONE and Telum AI Coprocessor telemetry."""
    telemetry = ibm_z_engine.get_system_telemetry()
    return {
        "status": "success",
        "telemetry": telemetry
    }

# ==============================================================================
# FEATURE 2: PRE-ALERT CALLER LOOKUP & COMMUNITY SCAM REGISTRY
# ==============================================================================
@app.get("/api/caller-lookup")
async def lookup_caller_pre_alert(phone: str = Query(..., description="Phone number or Caller ID to lookup")):
    """
    PRE-ALERT ENGINE: Queries the Community Scam Registry before call interaction.
    If the caller has been reported by others, triggers an immediate alert.
    """
    pre_alert = community_registry.lookup_caller(phone)
    # Accelerate look-up via simulated Telum cache
    telum_metric = ibm_z_engine.accelerate_tensor_inference([len(phone), pre_alert["report_count"]])
    pre_alert["ibm_telum_lookup_ms"] = telum_metric["telum_nnpa_latency_ms"]
    return {
        "status": "success",
        "pre_alert": pre_alert
    }

class ReportCallerRequest(BaseModel):
    phone: str
    caller_name: Optional[str] = "Unknown Caller"
    scam_vector: Optional[str] = "AI Voice Cloning / Urgency"
    modus_operandi: Optional[str] = ""
    tags: Optional[list] = []

@app.post("/api/report-caller")
async def report_fraudulent_caller(report: ReportCallerRequest):
    """
    Submits a new crowdsourced fraud report signed with IBM CPACF hardware cryptography.
    Immediately updates the registry so other users receive pre-alerts.
    """
    result = community_registry.report_caller(
        phone=report.phone,
        caller_name=report.caller_name,
        scam_vector=report.scam_vector,
        modus_operandi=report.modus_operandi,
        tags=report.tags
    )
    return {
        "status": "success",
        "data": result
    }

@app.get("/api/community-reports")
async def get_all_community_reports():
    """Returns list of trending reported scam numbers with community stats."""
    reports = community_registry.get_all_reports()
    return {
        "status": "success",
        "total": len(reports),
        "reports": reports
    }

# ==============================================================================
# FEATURE 3: LIVE CALL TRACKING & STREAM INTERCEPTION
# ==============================================================================
class LiveCallTrackRequest(BaseModel):
    call_id: str
    elapsed_seconds: int
    spoken_transcript: str
    caller_phone: str

@app.post("/api/track-live-call-stream")
async def track_live_call_stream(req: LiveCallTrackRequest):
    """
    Tracks an in-progress phone call in real time.
    As words are spoken, updates live risk trajectory, flags dynamic threats,
    and returns IBM Telum sub-millisecond scoring telemetry.
    """
    # 1. Run dynamic scam intent scan on running transcript
    intent_res = scam_analyzer.analyze_transcript(req.spoken_transcript)
    
    # 2. Check if caller was pre-reported in Community Registry
    caller_info = community_registry.lookup_caller(req.caller_phone)
    
    # 3. Compute dynamic live threat score
    base_scam_risk = intent_res["scam_risk_percent"]
    if caller_info["is_reported"]:
        # If community already reported this caller, baseline threat is elevated
        dynamic_threat = min(99.4, base_scam_risk + 35.0)
    else:
        dynamic_threat = base_scam_risk

    # 4. IBM Telum NNPA micro-latency tensor execution
    telum_res = ibm_z_engine.accelerate_tensor_inference([req.elapsed_seconds, dynamic_threat])

    # 5. Live Call Status State
    if dynamic_threat >= 75.0:
        call_action = "🚨 CRITICAL THREAT: AI SCAM CONFIRMED - RECOMMEND IMMEDIATE HANG UP"
        call_status = "CRITICAL_INTERCEPT"
        status_color = "red"
    elif dynamic_threat >= 45.0:
        call_action = "⚠️ SUSPICIOUS PATTERNS: HIGH URGENCY / COERCION DETECTED"
        call_status = "SUSPICIOUS_ACTIVE"
        status_color = "amber"
    else:
        call_action = "🛡️ MONITORING: NO IMMEDIATE EXTORTION TRIGGERS DETECTED"
        call_status = "SAFE_MONITORING"
        status_color = "emerald"

    return {
        "status": "success",
        "call_id": req.call_id,
        "elapsed_seconds": req.elapsed_seconds,
        "dynamic_threat_score": round(dynamic_threat, 1),
        "call_status": call_status,
        "status_color": status_color,
        "call_action": call_action,
        "caller_pre_alert": caller_info,
        "triggers_flagged": intent_res["detected_triggers"],
        "highlighted_transcript": intent_res["highlighted_transcript"],
        "telum_telemetry": telum_res
    }

# ==============================================================================
# UNIFIED THREAT CALCULATOR & FULL FORENSIC ANALYSIS PIPELINE
# ==============================================================================
def calculate_unified_threat(acoustic_prob: float, scam_prob: float, pre_reported: bool = False):
    """
    Computes the Unified Threat Index (UTI) combining Acoustic AI Probability,
    Conversational Social Engineering Risk, and Prior Community Reports.
    """
    # Base weighted sum
    base_threat = (0.55 * acoustic_prob) + (0.45 * scam_prob)
    
    if pre_reported:
        base_threat = min(99.4, base_threat * 1.15 + 10.0)

    # Synergistic interaction: If BOTH are high, threat spikes to maximum critical
    if acoustic_prob >= 70.0 and scam_prob >= 70.0:
        uti = min(99.4, max(base_threat * 1.08, 92.0))
        classification = "CRITICAL_VOICE_CLONE_SCAM"
        badge_text = "🚨 CRITICAL: DEEPFAKE IMPERSONATION SCAM DETECTED"
        color = "red"
        advice = "IMMEDIATELY TERMINATE CALL. Do not confirm identity, transfer funds, or provide credentials. High-probability deepfake combined with aggressive financial coercion."
    elif acoustic_prob >= 60.0 and scam_prob < 40.0:
        uti = base_threat
        classification = "SYNTHETIC_SPEECH_LOW_RISK"
        badge_text = "🤖 SYNTHETIC VOICE DETECTED (BENIGN / BOT)"
        color = "amber"
        advice = "Caller voice exhibits synthetic vocoder patterns, but spoken content does not contain typical scam extortion cues. Likely an automated interactive voice response (IVR) or voice assistant."
    elif acoustic_prob < 40.0 and scam_prob >= 65.0:
        uti = base_threat
        classification = "HUMAN_OPERATED_FRAUD"
        badge_text = "⚠️ HIGH RISK: HUMAN-DRIVEN SOCIAL ENGINEERING FRAUD"
        color = "orange"
        advice = "Natural human voice acoustics detected, but conversational patterns indicate aggressive scam/phishing intent. Suspected illegal boiler-room call center operation."
    else:
        uti = min(base_threat, 28.0)
        classification = "VERIFIED_SAFE_CALL"
        badge_text = "✅ CALL VERIFIED: NATURAL HUMAN ACOUSTICS & SAFE CONTENT"
        color = "emerald"
        advice = "Both vocal bio-acoustics and conversational intent are consistent with legitimate, benign communications."

    return {
        "unified_threat_score": round(uti, 1),
        "classification": classification,
        "badge_text": badge_text,
        "color_code": color,
        "primary_advice": advice
    }

@app.post("/api/analyze")
async def analyze_audio_file(
    audio: UploadFile = File(...),
    transcript: str = Form(""),
    preset_id: str = Form(""),
    phone_number: str = Form("")
):
    """
    Core Forensic Pipeline:
    1. Ingests raw audio stream (WAV, MP3, OGG, WebM)
    2. Runs Acoustic Forensics (Spectral, Pitch Jitter, Breathing, Vocoder phase)
    3. Runs Pre-Alert check in Community Scam Registry
    4. Analyzes Spoken Content (Social engineering keywords, coercion, isolation)
    5. Fuses on IBM Telum NNPA into Unified Threat Matrix
    6. Signs with IBM CPACF SHA-512 hardware-assisted seal
    """
    try:
        audio_bytes = await audio.read()
        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio file is empty or corrupted.")

        # If transcript not provided, check if it's one of the presets
        matched_caller_phone = phone_number
        if preset_id:
            for p in presets_list:
                if p["id"] == preset_id:
                    if not transcript.strip():
                        transcript = p["transcript"]
                    if not matched_caller_phone:
                        matched_caller_phone = p.get("caller", "")
                    break

        # 1. Run Acoustic Deepfake Forensics
        acoustic_res = forensics_engine.analyze(audio_bytes, filename=audio.filename)

        # 2. Check Pre-Alert Community Registry
        caller_pre_alert = community_registry.lookup_caller(matched_caller_phone)

        # 3. Run NLP / Social Engineering Intent Analysis
        intent_res = scam_analyzer.analyze_transcript(transcript)

        # 4. Fuse into Unified Threat Index (with Community Prior Weighting)
        threat_matrix = calculate_unified_threat(
            acoustic_res["deepfake_probability_percent"],
            intent_res["scam_risk_percent"],
            pre_reported=caller_pre_alert["is_reported"]
        )

        # 5. IBM Telum NNPA Inference Telemetry & CPACF Signature
        telum_telemetry = ibm_z_engine.accelerate_tensor_inference(
            [acoustic_res["deepfake_probability_percent"], intent_res["scam_risk_percent"]]
        )
        cpacf_signature = ibm_z_engine.sign_threat_report(
            f"{audio.filename}:{threat_matrix['unified_threat_score']}:{matched_caller_phone}"
        )

        # 6. Generate Unique Incident Report ID
        call_id = f"AEGIS-Z-{uuid.uuid4().hex[:8].upper()}"
        report_data = {
            "incident_id": call_id,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "caller_phone": matched_caller_phone,
            "file_info": acoustic_res["file_info"],
            "acoustic_analysis": acoustic_res,
            "caller_pre_alert": caller_pre_alert,
            "linguistic_analysis": intent_res,
            "threat_matrix": threat_matrix,
            "ibm_z_forensics": {
                "telum_acceleration": telum_telemetry,
                "cpacf_hardware_signature": cpacf_signature,
                "platform": ibm_z_engine.platform_name
            },
            "raw_transcript": transcript
        }

        # Store in-memory for download / view
        incident_reports[call_id] = report_data

        return {
            "status": "success",
            "incident_id": call_id,
            "threat_matrix": threat_matrix,
            "acoustic": acoustic_res,
            "caller_pre_alert": caller_pre_alert,
            "linguistic": intent_res,
            "ibm_z": {
                "telum": telum_telemetry,
                "cpacf": cpacf_signature,
                "platform": ibm_z_engine.platform_name
            },
            "transcript": transcript
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensic analysis failed: {str(e)}")

@app.get("/api/report/{incident_id}")
async def get_incident_report(incident_id: str):
    """Retrieves full incident dossier for police/court evidence submission."""
    report = incident_reports.get(incident_id)
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found.")
    return report

if __name__ == "__main__":
    print("=" * 70)
    print("🛡️  AEGISVOICE AI: Deepfake Voice Scam Interceptor on IBM LinuxONE")
    print("⚡  IBM Telum On-Chip AI Accelerator & CPACF Pervasive Encryption")
    print("🚀  Starting server at http://127.0.0.1:8000")
    print("=" * 70)
    uvicorn.run(app, host="127.0.0.1", port=8000)
