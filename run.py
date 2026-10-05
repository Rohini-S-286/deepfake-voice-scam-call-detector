"""
AegisVoice AI - Launcher Script
Opens browser automatically and runs the local server.
"""

import webbrowser
import threading
import time
import uvicorn
import os

def open_browser():
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    print("\n" + "="*65)
    print("🛡️  AEGISVOICE AI: Deepfake Voice Scam Call Interceptor")
    print("🚀  Starting server at http://127.0.0.1:8000")
    print("🌐  Opening web browser automatically...")
    print("="*65 + "\n")
    
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
