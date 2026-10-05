"""
Comprehensive System Verification Test - v3.0 (with IBM Z, Live Tracking & Pre-Alerts)
"""

import sys
import os

# Set UTF-8 encoding for Windows console output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_full_pipeline_v3():
    print("[1/6] Testing GET / ...")
    r_index = client.get("/")
    assert r_index.status_code == 200
    print("  -> Passed!")

    print("[2/6] Testing IBM Z / LinuxONE Telemetry endpoint ...")
    r_ibm = client.get("/api/ibm-z/telemetry")
    assert r_ibm.status_code == 200
    ibm_data = r_ibm.json()
    assert "telemetry" in ibm_data
    print(f"  -> Passed! Platform: {ibm_data['telemetry']['platform']}")
    print(f"     Telum Latency: {ibm_data['telemetry']['inference_latency_ms']} ms")

    print("[3/6] Testing PRE-ALERT Caller Lookup (reported scam number) ...")
    r_lookup = client.get("/api/caller-lookup?phone=+1 (844) 932-8491")
    assert r_lookup.status_code == 200
    pre_alert = r_lookup.json()["pre_alert"]
    assert pre_alert["is_reported"] is True
    assert pre_alert["report_count"] >= 100
    print(f"  -> Passed! Pre-Alert: {pre_alert['alert_headline']}")
    print(f"     Report Count: {pre_alert['report_count']}, Risk: {pre_alert['risk_level']}")

    print("[4/6] Testing Live Call Tracking Stream simulation ...")
    r_track = client.post(
        "/api/track-live-call-stream",
        json={
            "call_id": "CALL-LIVE-99",
            "elapsed_seconds": 12,
            "spoken_transcript": "I need you to wire the money immediately or the police will arrest me!",
            "caller_phone": "+1 (844) 932-8491"
        }
    )
    assert r_track.status_code == 200
    track_res = r_track.json()
    assert track_res["dynamic_threat_score"] >= 70.0
    print(f"  -> Passed! Dynamic Threat Score: {track_res['dynamic_threat_score']}%")
    print(f"     Call Status: {track_res['call_status']}")

    print("[5/6] Testing Submitting New Community Scam Report with CPACF Signature ...")
    r_rep = client.post(
        "/api/report-caller",
        json={
            "phone": "+1 555-SCAM-99",
            "caller_name": "Test Impersonation Fraudster",
            "scam_vector": "AI Voice Clone Testing",
            "modus_operandi": "Demanded crypto transfer.",
            "tags": ["Test", "Crypto"]
        }
    )
    assert r_rep.status_code == 200
    rep_result = r_rep.json()
    assert rep_result["status"] == "success"
    print(f"  -> Passed! Cryptographic Signature: {rep_result['data']['crypto_seal']['signature']}")

    print("[6/6] Testing Full Multi-Modal Audio Analysis with Pre-Alert Fusion ...")
    sample_path = os.path.join("samples", "scam_grandson_emergency.wav")
    with open(sample_path, "rb") as f:
        file_bytes = f.read()

    r_analyze = client.post(
        "/api/analyze",
        files={"audio": ("scam_grandson_emergency.wav", file_bytes, "audio/wav")},
        data={
            "transcript": "Grandma please wire $4500 immediately I am in jail keep this secret!",
            "preset_id": "preset_1",
            "phone_number": "+1 (844) 932-8491"
        }
    )
    assert r_analyze.status_code == 200
    res = r_analyze.json()
    assert res["threat_matrix"]["classification"] == "CRITICAL_VOICE_CLONE_SCAM"
    assert res["caller_pre_alert"]["is_reported"] is True
    print(f"  -> Passed! Threat Score: {res['threat_matrix']['unified_threat_score']}%")
    print(f"     Pre-Reported: {res['caller_pre_alert']['is_reported']}")

    print("\n" + "="*60)
    print("ALL 6 ENTERPRISE & IBM Z CAPABILITY TESTS PASSED WITH 100%!")
    print("="*60)

if __name__ == "__main__":
    test_full_pipeline_v3()
