"""
Community Scam Intelligence & Pre-Alert Threat Registry
Stores crowdsourced fraudulent numbers, previous deepfake vectors,
and generates instant Pre-Alerts before call interaction.
Backed by IBM CPACF cryptographic signing.
"""

import json
import os
import re
import time
from typing import Dict, Any, List
from ml_engine.ibm_z_engine import ibm_z_engine

REGISTRY_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "community_scams.json")

DEFAULT_SCAM_DATABASE = [
    {
        "phone": "+1 (844) 932-8491",
        "raw_digits": "18449328491",
        "caller_name": "Spoofed Family Emergency Bail Bonds",
        "report_count": 142,
        "risk_level": "CRITICAL",
        "scam_vector": "AI Voice Clone (Grandson Impersonation)",
        "modus_operandi": "Caller uses cloned voice of a grandson or son claiming a severe car accident and arrest, demanding $4,500 immediate bail wire transfer. Heavy urgency and coercive secrecy.",
        "tags": ["AI Voice Clone", "Family Emergency", "Bail Fraud", "Wire Transfer"],
        "last_reported": "14 minutes ago",
        "verified_scam": True,
        "cpacf_signature": "zCPACF-7e9b21a8d0f1c349e58b1a9c40df12ab...9f82b13c"
    },
    {
        "phone": "+1 (800) 432-1000",
        "raw_digits": "18004321000",
        "caller_name": "Spoofed National Bank Fraud Division (Chase/Citi)",
        "report_count": 98,
        "risk_level": "CRITICAL",
        "scam_vector": "Synthetic Vocoder (Bank Manager Impersonation)",
        "modus_operandi": "Synthesized voice posing as a senior security officer stating your bank account is frozen for crypto transactions. Demands immediate 6-digit OTP code to avoid arrest warrant.",
        "tags": ["Credential Harvesting", "Bank Impersonation", "OTP Theft", "Vocoder"],
        "last_reported": "45 minutes ago",
        "verified_scam": True,
        "cpacf_signature": "zCPACF-4a1c89ef03b98dae76c120bf99ad45ef...88bc01fa"
    },
    {
        "phone": "+44 20 7946 0192",
        "raw_digits": "442079460192",
        "caller_name": "Executive Mobile Spoof (London Office)",
        "report_count": 67,
        "risk_level": "CRITICAL",
        "scam_vector": "AI Voice Clone (C-Suite Executive / CEO)",
        "modus_operandi": "High-fidelity clone of company CEO claiming to be in confidential acquisition negotiations. Demands urgent wire transfer of $85,000 within 30 minutes with strict secrecy.",
        "tags": ["Executive Impersonation", "CEO Fraud", "Corporate Wire", "Deepfake"],
        "last_reported": "2 hours ago",
        "verified_scam": True,
        "cpacf_signature": "zCPACF-99d0e12ba478c93b6e8201fa34cd88bb...77de91aa"
    },
    {
        "phone": "+91 98765 43210",
        "raw_digits": "919876543210",
        "caller_name": "Customs Narcotics Department Impersonator",
        "report_count": 215,
        "risk_level": "CRITICAL",
        "scam_vector": "Synthetic Audio & Fake Police Intimidation",
        "modus_operandi": "Claims a courier parcel containing narcotics and forged passports has been seized in your name. Threatens immediate digital arrest and CBI charges unless security deposit is transferred.",
        "tags": ["Digital Arrest", "Customs Extortion", "Narcotics Scam", "Police Threat"],
        "last_reported": "5 minutes ago",
        "verified_scam": True,
        "cpacf_signature": "zCPACF-11ea34bf9902ce7612ad55bc89ef33dc...55cc99ef"
    },
    {
        "phone": "+1 (888) 293-1102",
        "raw_digits": "18882931102",
        "caller_name": "IRS Tax Enforcement & Penalty Division",
        "report_count": 83,
        "risk_level": "HIGH",
        "scam_vector": "Robotic Automated Extortion (VALL-E clone)",
        "modus_operandi": "Automated voice stating a federal lawsuit has been filed against you for unpaid taxes. Instructs to pay via Apple gift cards or crypto to cancel deputy sheriff dispatch.",
        "tags": ["IRS Fraud", "Gift Card Scam", "Tax Extortion"],
        "last_reported": "3 hours ago",
        "verified_scam": True,
        "cpacf_signature": "zCPACF-33fe88ac220199bc66ee44aa77ff1100...22bb66dd"
    },
    {
        "phone": "+1 (212) 555-0144",
        "raw_digits": "12125550144",
        "caller_name": "City Health Wellness Clinic",
        "report_count": 0,
        "risk_level": "VERIFIED_SAFE",
        "scam_vector": "Authentic Healthcare Provider",
        "modus_operandi": "Routine appointment reminder and follow-up. Zero scam reports logged.",
        "tags": ["Verified Caller", "Medical Clinic", "Routine", "Safe"],
        "last_reported": "Never (Clean Record)",
        "verified_scam": False,
        "cpacf_signature": "zCPACF-CLEAN-RECORD-AUTHENTICATED"
    }
]

class CommunityScamRegistry:
    def __init__(self):
        os.makedirs(os.path.dirname(REGISTRY_FILE), exist_ok=True)
        self.load_database()

    def load_database(self):
        """Loads scam database from disk or initializes with default verified threats."""
        if os.path.exists(REGISTRY_FILE):
            try:
                with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                    self.database = json.load(f)
                    return
            except Exception:
                pass
        self.database = list(DEFAULT_SCAM_DATABASE)
        self.save_database()

    def save_database(self):
        """Persists database to disk."""
        try:
            with open(REGISTRY_FILE, "w", encoding="utf-8") as f:
                json.dump(self.database, f, indent=2)
        except Exception as e:
            print("Failed to save registry:", e)

    def normalize_number(self, phone: str) -> str:
        """Strips symbols, spaces, and punctuation for robust matching."""
        if not phone:
            return ""
        return re.sub(r"[^\d]", "", phone)

    def lookup_caller(self, phone: str) -> Dict[str, Any]:
        """
        Instant Pre-Alert Caller Lookup.
        Returns prior community reports, threat level, and pre-alert warnings
        BEFORE the user answers or interacts with the call.
        """
        clean_input = self.normalize_number(phone)
        
        # Match exact digits or suffix match (last 10 digits)
        matched_entry = None
        for entry in self.database:
            clean_entry = entry["raw_digits"]
            if clean_input and (clean_input == clean_entry or clean_input.endswith(clean_entry[-10:]) or clean_entry.endswith(clean_input[-10:])):
                matched_entry = entry
                break

        if matched_entry and matched_entry["verified_scam"]:
            # Prior community reports exist -> PRE-ALERT TRIGGERED!
            rep_count = matched_entry["report_count"]
            risk = matched_entry["risk_level"]
            return {
                "is_reported": True,
                "pre_alert_level": "CRITICAL_RED_FLAG" if rep_count >= 50 else "HIGH_RISK",
                "badge_color": "red" if rep_count >= 50 else "amber",
                "phone": matched_entry["phone"],
                "caller_name": matched_entry["caller_name"],
                "report_count": rep_count,
                "risk_level": risk,
                "scam_vector": matched_entry["scam_vector"],
                "modus_operandi": matched_entry["modus_operandi"],
                "tags": matched_entry["tags"],
                "last_reported": matched_entry["last_reported"],
                "alert_headline": f"🚨 PRE-ALERT: {rep_count} COMMUNITY FRAUD REPORTS DETECTED!",
                "alert_message": f"This number was flagged {rep_count} times by community users for '{matched_entry['scam_vector']}'. DO NOT ANSWER OR PROCEED WITH EXTREME CAUTION.",
                "action_advisory": "Reject call immediately. Under no circumstances wire money, send crypto, or disclose 6-digit OTPs.",
                "cpacf_signature": matched_entry["cpacf_signature"]
            }
        elif matched_entry and not matched_entry["verified_scam"]:
            # Verified safe number
            return {
                "is_reported": False,
                "pre_alert_level": "VERIFIED_SAFE",
                "badge_color": "emerald",
                "phone": matched_entry["phone"],
                "caller_name": matched_entry["caller_name"],
                "report_count": 0,
                "risk_level": "SAFE",
                "scam_vector": "Verified Legitimate Institution",
                "modus_operandi": matched_entry["modus_operandi"],
                "tags": matched_entry["tags"],
                "last_reported": "Clean Record",
                "alert_headline": "✅ CALLER VERIFIED: NO PRIOR FRAUD REPORTS",
                "alert_message": f"{matched_entry['caller_name']} is in the community verified safe directory. Standard real-time AI audio monitoring active.",
                "action_advisory": "Standard vigilance. Safe to answer.",
                "cpacf_signature": matched_entry["cpacf_signature"]
            }
        else:
            # Unknown number (not in registry yet)
            return {
                "is_reported": False,
                "pre_alert_level": "UNVERIFIED_NUMBER",
                "badge_color": "cyan",
                "phone": phone,
                "caller_name": "Unregistered / Unknown Caller",
                "report_count": 0,
                "risk_level": "UNKNOWN",
                "scam_vector": "Real-time AI Audio Inspection Required",
                "modus_operandi": "No prior crowdsourced reports for this number. Real-time acoustic and linguistic forensics will analyze the live audio stream.",
                "tags": ["Unverified", "Live Analysis Active"],
                "last_reported": "No prior data",
                "alert_headline": "ℹ️ UNREGISTERED CALLER: REAL-TIME AI INTERCEPTION READY",
                "alert_message": "No community reports on record. Live bio-acoustic vocoder tracking will inspect caller voice during the call.",
                "action_advisory": "Answer with standard caution. AegisVoice will alert you instantly if AI voice cloning is detected.",
                "cpacf_signature": "zCPACF-NEW-INCOMING-QUERY"
            }

    def report_caller(self, phone: str, caller_name: str, scam_vector: str, modus_operandi: str, tags: List[str]) -> Dict[str, Any]:
        """
        Submits a new crowdsourced fraud report to the Community Scam Registry.
        Signs the report with IBM CPACF hardware-assisted cryptographic sealing.
        """
        clean_input = self.normalize_number(phone)
        if not clean_input:
            clean_input = "0000000000"

        # Check if already exists in database
        existing = None
        for entry in self.database:
            if self.normalize_number(entry["phone"]) == clean_input:
                existing = entry
                break

        # Cryptographically sign the community report using IBM CPACF
        payload = f"{phone}:{caller_name}:{scam_vector}:{time.time()}"
        crypto_seal = ibm_z_engine.sign_threat_report(payload)

        if existing:
            existing["report_count"] += 1
            existing["last_reported"] = "Just now"
            existing["verified_scam"] = True
            existing["risk_level"] = "CRITICAL"
            if modus_operandi and len(modus_operandi) > 5:
                existing["modus_operandi"] = modus_operandi
            existing["cpacf_signature"] = crypto_seal["signature"]
            self.save_database()
            return {
                "status": "updated",
                "message": f"Report added. Total community reports for {phone} increased to {existing['report_count']}.",
                "entry": existing,
                "crypto_seal": crypto_seal
            }
        else:
            new_entry = {
                "phone": phone,
                "raw_digits": clean_input,
                "caller_name": caller_name or "Reported Scam Caller",
                "report_count": 1,
                "risk_level": "SUSPICIOUS",
                "scam_vector": scam_vector or "AI Voice Clone Suspicion",
                "modus_operandi": modus_operandi or "Community member reported suspicious urgency or synthetic voice patterns.",
                "tags": tags if tags else ["Community Reported", "Suspicious"],
                "last_reported": "Just now",
                "verified_scam": True,
                "cpacf_signature": crypto_seal["signature"]
            }
            self.database.insert(0, new_entry)
            self.save_database()
            return {
                "status": "created",
                "message": f"Successfully registered new scam report for {phone}.",
                "entry": new_entry,
                "crypto_seal": crypto_seal
            }

    def get_all_reports(self) -> List[Dict[str, Any]]:
        """Returns trending community scam reports."""
        return sorted(self.database, key=lambda x: x["report_count"], reverse=True)

# Global Instance
community_registry = CommunityScamRegistry()
