"""
Scam Intent & Social Engineering Detection Engine
Analyzes conversational transcripts, semantic threat indicators,
urgency pressure, and financial extortion patterns.
"""

import re
from typing import List, Dict, Any

class ScamIntentAnalyzer:
    def __init__(self):
        # Comprehensive scam taxonomies with threat weights
        self.SCAM_CATEGORIES = {
            "financial_extortion": {
                "weight": 0.35,
                "label": "Financial Demand / Credential Harvesting",
                "patterns": [
                    r"\botp\b", r"\bone[- ]time password\b", r"\bpin\b", r"\bcvv\b",
                    r"\bwire transfer\b", r"\bcrypto\b", r"\bbitcoin\b", r"\bgift card\b",
                    r"\bbank account\b", r"\btransfer (money|funds|cash|\$\d+|\₹\d+)\b",
                    r"\bupi\b", r"\brtgs\b", r"\bwestern union\b", r"\bzelle\b", r"\bcashapp\b",
                    r"\bcredit card number\b", r"\bsend money\b", r"\bpay (immediately|now)\b"
                ]
            },
            "urgency_and_intimidation": {
                "weight": 0.30,
                "label": "Psychological Coercion & Urgency",
                "patterns": [
                    r"\bright now\b", r"\bimmediately\b", r"\bwithin (5|10|15|30) minutes\b",
                    r"\bdo not hang up\b", r"\bstay on the line\b", r"\barrest warrant\b",
                    r"\bpolice\b", r"\bjail\b", r"\blaw enforcement\b", r"\bcourt\b",
                    r"\bfir\b", r"\bseized\b", r"\bcontraband\b", r"\bnarcotics\b",
                    r"\bemergency\b", r"\bserious trouble\b", r"\baccount blocked\b",
                    r"\bsuspended immediately\b", r"\bfrozen\b"
                ]
            },
            "secrecy_and_isolation": {
                "weight": 0.20,
                "label": "Victim Isolation & Secrecy Tactics",
                "patterns": [
                    r"\bdo not tell (anyone|your family|your parents|your husband|your wife)\b",
                    r"\bkeep this (secret|confidential)\b", r"\bdo not speak to (anyone|the teller)\b",
                    r"\bclassified\b", r"\bunder surveillance\b", r"\bdon't call anyone\b"
                ]
            },
            "impersonation_vectors": {
                "weight": 0.15,
                "label": "Authority / Family Impersonation",
                "patterns": [
                    r"\bgrandma\b", r"\bgrandpa\b", r"\bmom\b", r"\bdad\b", r"\byour son\b", r"\byour grandson\b",
                    r"\bi had an accident\b", r"\bi am in jail\b", r"\bcustoms department\b",
                    r"\bfbi\b", r"\binterpol\b", r"\bcbi\b", r"\btax department\b", r"\birs\b",
                    r"\bfraud investigation team\b", r"\bsecurity department\b", r"\bfedex\b", r"\bdhl\b"
                ]
            }
        }

    def analyze_transcript(self, text: str) -> Dict[str, Any]:
        """
        Analyzes the spoken text for scam social engineering indicators.
        Returns risk score, flagged trigger words, category breakdown, and defense protocol.
        """
        if not text or len(text.strip()) == 0:
            return {
                "scam_risk_percent": 5.0,
                "risk_tier": "MINIMAL_RISK",
                "detected_triggers": [],
                "category_scores": {},
                "defense_protocol": ["Monitor audio for unsolicited requests."],
                "highlighted_transcript": ""
            }

        text_lower = text.lower()
        detected_triggers = []
        category_scores = {}
        weighted_score_sum = 0.0

        highlighted_text = text

        for cat_key, cat_data in self.SCAM_CATEGORIES.items():
            matches_in_cat = []
            for pattern in cat_data["patterns"]:
                found = list(re.finditer(pattern, text_lower))
                for m in found:
                    match_str = m.group(0)
                    matches_in_cat.append(match_str)
                    detected_triggers.append({
                        "phrase": match_str,
                        "category": cat_data["label"],
                        "severity": "HIGH" if cat_key in ["financial_extortion", "urgency_and_intimidation"] else "MEDIUM"
                    })
                    # Highlight in text
                    regex = re.compile(re.escape(match_str), re.IGNORECASE)
                    highlighted_text = regex.sub(f"<mark class='scam-flag'>{match_str}</mark>", highlighted_text)

            cat_density = min(len(matches_in_cat) / 2.0, 1.0)
            category_scores[cat_data["label"]] = round(cat_density * 100, 1)
            weighted_score_sum += cat_density * cat_data["weight"]

        # Baseline text sentiment heuristics
        length_factor = min(len(text.split()) / 30.0, 1.0)
        final_scam_risk = min(weighted_score_sum * 100.0 * 1.35, 99.0)

        # Ensure realistic floor/ceiling
        if len(detected_triggers) >= 3:
            final_scam_risk = max(final_scam_risk, 78.0)
        elif len(detected_triggers) >= 1:
            final_scam_risk = max(final_scam_risk, 42.0)
        else:
            final_scam_risk = max(final_scam_risk, 4.0)

        final_scam_risk = round(final_scam_risk, 1)

        # Risk Tier
        if final_scam_risk >= 70.0:
            risk_tier = "CRITICAL_SCAM"
        elif final_scam_risk >= 40.0:
            risk_tier = "SUSPICIOUS_INTENT"
        else:
            risk_tier = "SAFE_CONVERSATION"

        # Actionable Defense Checklist
        defense_protocol = self._generate_defense_protocol(detected_triggers, risk_tier)

        return {
            "scam_risk_percent": final_scam_risk,
            "risk_tier": risk_tier,
            "detected_triggers": detected_triggers,
            "category_scores": category_scores,
            "defense_protocol": defense_protocol,
            "highlighted_transcript": highlighted_text
        }

    def _generate_defense_protocol(self, triggers: List[Dict[str, Any]], risk_tier: str) -> List[str]:
        """Provides actionable real-world security countermeasures for victims."""
        actions = []
        if risk_tier == "CRITICAL_SCAM":
            actions.append("🚨 HANG UP IMMEDIATELY. Do not transfer funds or share any codes.")
            actions.append("🔐 NEVER disclose OTPs, PINs, or card credentials over an incoming call.")
            actions.append("📞 Verify independently: Call the person or institution using a pre-saved trusted contact number.")
            actions.append("🗣️ Ask a Shared Family Secret Passcode (known only to you and your real family member).")
            actions.append("🛡️ Report immediately to Cybercrime helpline (Dial 1930 / cybercrime.gov.in or local cyber patrol).")
        elif risk_tier == "SUSPICIOUS_INTENT":
            actions.append("⚠️ Exercise extreme caution: High-pressure urgency tactics detected.")
            actions.append("⏸️ Take a pause: Scammers intentionally fabricate emergency deadlines to bypass logical thinking.")
            actions.append("🔍 Demand written verification on official bank/agency letterhead before taking action.")
            actions.append("🛑 Refuse any request to keep the call secret from relatives or friends.")
        else:
            actions.append("✅ Low threat patterns detected in spoken content.")
            actions.append("💡 Standard vigilance: Never share banking OTPs with any caller under any circumstance.")

        return actions
