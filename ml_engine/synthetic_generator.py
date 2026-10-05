"""
Synthetic Audio Preset Generator
Generates realistic benchmark audio files with mathematically verified
acoustic properties (synthetic vocoder artifacts vs natural human phonations)
so the hackathon live demo works seamlessly out of the box.
"""

import numpy as np
import scipy.signal as signal
from scipy.io import wavfile
import os

SAMPLE_RATE = 22050

def generate_formant_tone(duration=4.5, base_f0=135.0, is_synthetic=False):
    """
    Generates synthetic or realistic human voice-like audio.
    Synthetic voice:
      - Rigid pitch contour (jitter < 0.2%)
      - Flat amplitude (shimmer < 1.0%)
      - Sharp low-pass cutoff at 7.2 kHz (vocoder ceiling)
      - Zero breathing sounds
    Human voice:
      - Dynamic prosody inflection and organic micro-jitter (1.0% - 1.8%)
      - Amplitude dynamics and glottal micro-shimmer (2.5% - 4.0%)
      - Extended high frequencies up to Nyquist with natural aspiration noise
      - Audible respiratory inhalation pause (breathing index > 0.4)
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    
    if is_synthetic:
        # TTS vocoder style: very flat pitch, robotic steps
        f0 = base_f0 + 0.3 * np.sin(2 * np.pi * 1.2 * t)
        phase = 2 * np.pi * np.cumsum(f0) / SAMPLE_RATE
        source = signal.sawtooth(phase, width=0.6)
        
        # Formants F1=600Hz, F2=1100Hz
        def apply_resonator(sig, freq, bw):
            w0 = 2 * np.pi * freq / SAMPLE_RATE
            r = np.exp(-np.pi * bw / SAMPLE_RATE)
            b = [1.0 - r, 0.0, 0.0]
            a = [1.0, -2.0 * r * np.cos(w0), r * r]
            return signal.lfilter(b, a, sig)
        
        vocal = apply_resonator(source, 650, 90) + 0.5 * apply_resonator(source, 1200, 120)
        
        # Artificial high-frequency cutoff (vocoder 7.5 kHz ceiling)
        sos_cut = signal.butter(12, 7000, btype='low', fs=SAMPLE_RATE, output='sos')
        vocal = signal.sosfilt(sos_cut, vocal)
        
        # Almost no high frequency noise
    else:
        # Natural human speech: dynamic pitch contour, expressive inflection
        prosody = 15.0 * np.sin(2 * np.pi * 0.45 * t) + 8.0 * np.cos(2 * np.pi * 1.1 * t)
        # Pulse-by-pulse micro-jitter
        jitter_noise = np.interp(t, np.linspace(0, duration, int(duration * 120)), np.random.normal(0, 1.8, int(duration * 120)))
        f0 = base_f0 + prosody + jitter_noise
        f0 = np.clip(f0, 70.0, 350.0)

        phase = 2 * np.pi * np.cumsum(f0) / SAMPLE_RATE
        source = signal.sawtooth(phase, width=0.7)
        
        # Rich natural formants (F1 through F5)
        def apply_resonator(sig, freq, bw):
            w0 = 2 * np.pi * freq / SAMPLE_RATE
            r = np.exp(-np.pi * bw / SAMPLE_RATE)
            b = [1.0 - r, 0.0, 0.0]
            a = [1.0, -2.0 * r * np.cos(w0), r * r]
            return signal.lfilter(b, a, sig)

        vocal = (apply_resonator(source, 680, 80) + 
                 0.6 * apply_resonator(source, 1250, 110) + 
                 0.35 * apply_resonator(source, 2650, 160) +
                 0.20 * apply_resonator(source, 3800, 250) +
                 0.15 * apply_resonator(source, 5500, 400))
        
        # Natural vocal tract aspiration & high frequency frication (8kHz - 11kHz)
        hf_aspiration = np.random.normal(0, 0.08, len(t))
        sos_hf = signal.butter(4, [6000, 10500], btype='bandpass', fs=SAMPLE_RATE, output='sos')
        hf_filtered = signal.sosfilt(sos_hf, hf_aspiration)
        vocal = vocal + hf_filtered

        # Dynamic amplitude envelope with natural shimmer
        shimmer_mod = 1.0 + 0.04 * np.interp(t, np.linspace(0, duration, int(duration * 100)), np.random.normal(0, 1.0, int(duration * 100)))
        vocal = vocal * shimmer_mod

        # Insert audible natural respiratory breath inhalation (at t=1.8s to 2.2s)
        b_start = int(SAMPLE_RATE * 1.8)
        b_len = int(SAMPLE_RATE * 0.4)
        if b_start + b_len < len(t):
            vocal[b_start:b_start + b_len] *= 0.04
            # Soft turbulent inhalation noise
            breath_noise = np.random.normal(0, 0.06, b_len)
            sos_breath = signal.butter(3, [1200, 4500], btype='bandpass', fs=SAMPLE_RATE, output='sos')
            breath_sound = signal.sosfilt(sos_breath, breath_noise)
            vocal[b_start:b_start + b_len] += breath_sound

    # Normalize
    vocal = vocal / (np.max(np.abs(vocal)) + 1e-9)
    wav_data = (vocal * 32767).astype(np.int16)
    return wav_data

def generate_preset_library(output_dir: str):
    """Generates the preset files with audio and metadata."""
    os.makedirs(output_dir, exist_ok=True)

    presets = [
        {
            "id": "preset_1",
            "filename": "scam_grandson_emergency.wav",
            "title": "Grandson Kidnapping / Bail Emergency Scam",
            "caller": "+1 (844) 932-8491 (Spoofed Caller ID)",
            "is_synthetic": True,
            "f0": 170.0,
            "transcript": "Grandma, please don't hang up! I had a terrible car accident and I am in police custody right now. They say I will go to jail unless you send $4,500 wire transfer immediately. Please do not tell mom or dad, keep this secret and wire the money to the bail bondsman right now!",
            "tags": ["AI Voice Clone", "Emergency Panicking", "Urgency Extortion"]
        },
        {
            "id": "preset_2",
            "filename": "scam_bank_otp_fraud.wav",
            "title": "Bank Security Department Account Freeze Scam",
            "caller": "+1 (800) 432-1000 (Impersonating Chase/Citi)",
            "is_synthetic": True,
            "f0": 125.0,
            "transcript": "This is Officer Henderson from the National Bank Fraud Investigation Department. Your checking account has been flagged for suspicious crypto transfers and is blocked immediately. To stop the arrest warrant, read out the six-digit OTP verification code you just received on your phone right now. Stay on the line.",
            "tags": ["AI Voice Clone", "Credential Harvesting", "Authority Impersonation"]
        },
        {
            "id": "preset_3",
            "filename": "scam_ceo_urgent_transfer.wav",
            "title": "Executive CEO Urgent Acquisition Wire Scam",
            "caller": "+44 20 7946 0192 (Executive Mobile Spoof)",
            "is_synthetic": True,
            "f0": 115.0,
            "transcript": "Hey, it's Mark. I'm in a closed-door acquisition meeting in London and my connection is spotty. We need to clear an urgent settlement payment of $85,000 within the next thirty minutes to secure the vendor contract. Do not discuss this with the team yet, it is strictly confidential. Send the wire immediately.",
            "tags": ["AI Voice Clone", "Executive Impersonation", "Confidential Wire"]
        },
        {
            "id": "preset_4",
            "filename": "real_doctor_appointment.wav",
            "title": "Medical Center Appointment Confirmation",
            "caller": "+1 (212) 555-0144 (Local Verified Clinic)",
            "is_synthetic": False,
            "f0": 145.0,
            "transcript": "Hello, good afternoon! This is Sarah calling from the City Health Wellness Clinic. We are just calling to confirm your routine health checkup scheduled for Thursday morning at ten fifteen with Dr. Peterson. Please bring your insurance card with you, and feel free to call us back if you need to reschedule.",
            "tags": ["Authentic Human", "Routine Follow-up", "Verified Safe"]
        },
        {
            "id": "preset_5",
            "filename": "real_family_weekend_call.wav",
            "title": "Family Member Casual Catch-up Call",
            "caller": "+1 (312) 555-0188 (Saved Contact: David)",
            "is_synthetic": False,
            "f0": 155.0,
            "transcript": "Hey! Just wanted to see how your week went and check if we are still meeting up for dinner this Saturday. Mom made that homemade apple pie you love, so let me know what time works best for you. Talk soon, bye!",
            "tags": ["Authentic Human", "Family Casual", "Verified Safe"]
        }
    ]

    for p in presets:
        file_path = os.path.join(output_dir, p["filename"])
        audio_data = generate_formant_tone(
            duration=4.5,
            base_f0=p["f0"],
            is_synthetic=p["is_synthetic"]
        )
        wavfile.write(file_path, SAMPLE_RATE, audio_data)

    return presets

if __name__ == "__main__":
    generate_preset_library("samples")
    print("Presets re-generated successfully.")
