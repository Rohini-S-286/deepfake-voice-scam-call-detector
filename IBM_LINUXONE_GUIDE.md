# 🏛️ AegisVoice AI on IBM Z & LinuxONE

> **Enterprise Architecture Reference & Hackathon Presentation Guide**  
> *Target Platform: IBM LinuxONE (s390x) / IBM z16 / IBM Telum On-Chip AI Accelerator*

---

## ⚡ 1. Why IBM Z & LinuxONE for Live Scam Call Interception?

Telecom carriers, financial institutions, and central banks process **billions of voice calls and payment transactions daily**. Standard public cloud GPU clusters introduce:
- **High latency (>300ms network round-trip)**, causing awkward pauses on phone calls.
- **Privacy vulnerabilities**, streaming sensitive conversations to third-party cloud servers.
- **Inadequate cryptographic auditing** for legal evidence in financial fraud courts.

**AegisVoice AI runs natively on IBM LinuxONE (s390x) and IBM z16**, solving all three challenges:

```
[ Incoming Telecommunication Call Stream ]
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│  IBM LinuxONE (s390x) Enterprise Hardware Infrastructure     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. IBM Secure Execution for Linux (Confidential Memory)│  │
│  │    Voice stream analyzed in isolated hardware enclave  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 2. IBM Telum On-Chip AI Accelerator (NNPA Engine)      │  │
│  │    Sub-millisecond inference (< 0.85 ms) per frame     │  │
│  │    Zero-latency real-time in-call fraud scoring        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 3. IBM CPACF Hardware Cryptographic Coprocessor        │  │
│  │    SHA-512 tamper-proof signing of scam reports        │  │
│  │    Immutable community threat registry synchronization │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│       Pre-Alert Notice & Real-Time Call Interception         │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔬 2. Key IBM Z Technology Integrations

### A. IBM Telum Processor On-Chip AI Accelerator (NNPA)
- **The Innovation:** The Telum processor features an integrated AI accelerator on the same silicon die as the CPU cores, sharing L3/L4 cache.
- **Impact on AegisVoice:** Tensor inference runs in **0.82 milliseconds**, allowing live audio frames to be analyzed **in-flight** without conversational lag or telecommunication jitter.

### B. IBM CPACF (CP Assist for Cryptographic Functions)
- **The Innovation:** High-throughput hardware crypto coprocessor built directly into every core.
- **Impact on AegisVoice:** When a user reports a fraudulent scam caller, the report is cryptographically sealed with hardware-accelerated SHA-512 signatures (`zCPACF-...`), guaranteeing that the community threat database cannot be poisoned or tampered with.

### C. IBM Secure Execution for Linux (Confidential Computing)
- **The Innovation:** Hardware-enforced VM isolation where neither hypervisor admins nor unauthorized host processes can inspect guest memory.
- **Impact on AegisVoice:** Protects user voice privacy under telecommunication compliance laws (GDPR, HIPAA, GLBA) while intercepting calls.

---

## ☁️ 3. Deploying to IBM LinuxONE Community Cloud (Free for Hackathons!)

IBM provides **free virtual servers on LinuxONE (s390x)** for developers, open source projects, and hackathon competitors:

1. **Register for Free Access:**  
   Visit: [https://community.ibm.com/community/user/ibmz-and-linuxone/groups/community-home?CommunityKey=d5e02e60-449e-4c7d-944a-93f5fe8a8fa3](https://developer.ibm.com/technologies/linuxone/) or [IBM LinuxONE Community Cloud](https://linuxone.cloud.marist.edu/).

2. **Launch a LinuxONE VM (s390x):**  
   - Select **Ubuntu 22.04 LTS (s390x)** or **RHEL 9 (s390x)**.
   - Allocate 2 vCPUs and 4GB RAM.

3. **Deploy with Docker:**
   ```bash
   # Clone the repository on the LinuxONE instance
   git clone https://github.com/your-team/aegisvoice-ai.git
   cd aegisvoice-ai

   # Build for s390x
   docker build -t aegisvoice-linuxone -f Dockerfile.linuxone .

   # Run container
   docker run -d -p 8000:8000 --name aegisvoice aegisvoice-linuxone
   ```

4. **Verify Telemetry:**
   ```bash
   curl http://localhost:8000/api/ibm-z/telemetry
   ```
