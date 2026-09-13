<<<<<<< HEAD
# 🛡️ SkySentinal — Autonomous AI Command Center

> **AI-powered video intelligence for proactive border surveillance.**  
> SentryX transforms existing IP CCTV infrastructure into an intelligent command center capable of detecting, analyzing, and reporting potential security incidents.

---

## 🌐 Live Web App

### 🚀 [Open SentryX Command Center](https://sentry-x-nine.vercel.app/settings)

**Production URL:**  
https://sentry-x-nine.vercel.app/settings

---

## ✨ Key Features

| Module | Description |
|---|---|
| 🎥 **Video Analytics** | Analyze MP4, AVI, MOV footage or public YouTube sources |
| 🚨 **Threat Detection** | Detect restricted-zone and tripwire breaches |
| 📍 **Smart Geometry** | Create draggable restricted zones on the calibration frame |
| 🚗 **Plate Detection** | Detect and report vehicle license plates |
| 📡 **Alert Telemetry** | Decode and display incident alert information |
| 📊 **Incident Reports** | Generate and download `incident_report.json` |
| 🧠 **Edge AI** | Designed for low-latency AI-powered video processing |
| 📚 **Research Hub** | Curated reports from trusted institutions |

---

## 🖥️ Application Pages

```text
SentryX
│
├── /                 → Overview + Tactical Camera Dashboard
├── /platform         → Edge-AI Architecture
├── /solutions        → Deployment Scenarios
├── /pricing          → Pricing + FAQ + Briefing Form
└── /resources        → Reports + Newsletter
```

---

## 🎯 Tactical Workbench

The Overview page provides an **IBVAP-compatible video analytics workflow**.

### Workflow

```text
┌─────────────────────┐
│ Upload Video / URL  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Calibration Frame   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Draw Zones /        │
│ Tripwires           │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Coordinate Scaling  │
│ 800×450 → 1920×1080 │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ AI Video Analysis   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Detection + Alerts  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Incident Report     │
└─────────────────────┘
```

### Supported Inputs

- `MP4`
- `AVI`
- `MOV`
- Public YouTube URLs

### Geometry Calibration

Restricted zones and tripwires can be positioned interactively on the calibration frame.

Display coordinates:

```text
800 × 450
```

Native video coordinates:

```text
1920 × 1080
```

The application automatically scales the coordinates between these resolutions.

---

## 📡 IBVAP API

The tactical workbench sends:

```text
multipart/form-data
```

to:

```text
NEXT_PUBLIC_IBVAP_API_BASE_URL
```

Configure a custom backend through `.env.local`:

```env
NEXT_PUBLIC_IBVAP_API_BASE_URL=YOUR_BACKEND_URL
```

---

## 📊 Analytics Output

The workbench can provide:

```text
✓ Breach counts
✓ Detected license plates
✓ Alert telemetry
✓ Incident metadata
✓ incident_report.json
```

---

## 📚 Resources

The Resources page includes verified and linked reports from:

- 🇪🇺 European Commission
- 🇪🇺 EU Publications Office
- 🇬🇧 GOV.UK
- 🇺🇸 NIST
- 🔬 CORDIS

---

## ⚙️ Tech Stack

```text
Frontend
├── Next.js
├── React
├── CSS
└── Native Browser APIs

Video Intelligence
└── IBVAP-Compatible Analytics Workflow

Deployment
└── Vercel
```

The interface is intentionally **dependency-light**.  
Interactivity is implemented using React state and native browser APIs, while the responsive visual system is contained primarily within:

```text
app/globals.css
```

---

## 🚀 Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

### 3. Open the application

```text
http://localhost:3000
```

If port `3000` is already occupied, Next.js will use the available port shown in the terminal.

---

## 🔐 Environment Configuration

Create:

```text
.env.local
```

Then configure:

```env
NEXT_PUBLIC_IBVAP_API_BASE_URL=YOUR_BACKEND_URL
```

---

## 🏗️ Project Structure

```text
SentryX/
│
├── app/
│   ├── globals.css
│   ├── page.*
│   ├── platform/
│   ├── solutions/
│   ├── pricing/
│   └── resources/
│
├── public/
├── package.json
├── .env.local
└── README.md
```

---

## 🌍 Deployment

### Production

🚀 **[Launch SentryX](https://sentry-x-nine.vercel.app/settings)**

```text
https://sentry-x-nine.vercel.app/settings
```

---

<p align="center">

## 🛡️ SENTRYX

### **Observe. Detect. Respond.**

*Proactive security powered by AI-driven video intelligence.*

</p>
=======
# SentryX — AI-Powered Drone Surveillance

Thermal and low-light computer vision for detecting suspicious human movement inside a defined perimeter.

SentryX analyzes drone footage to detect people, maintain tracks, evaluate restricted zones and tripwires, and surface explainable alerts for operator review. Behavior classification and risk scoring are prototype pipeline stages unless a live inference run provides them.

---

## Live app

https://sentry-x-nine.vercel.app

---

## What it does

| Layer | Status |
|---|---|
| Video upload & playback | Implemented |
| Thermal / low-light / RGB viewing | Implemented (UI) |
| Restricted zones & tripwires | Implemented |
| Person detection + tracking | Implemented via inference host when configured |
| Movement / behavior classification | Prototype |
| Explainable risk scoring | Prototype UI |
| Model evaluation metrics | Awaiting measurement |

---

## Pages

```text
/                 Overview
/drone-surveillance Drone Surveillance + AI analysis workbench
/alerts            Alerts & Incidents
/datasets-models   Datasets & Models
/settings         Surveillance settings
```

`/demo`, `/platform`, `/solutions`, and `/resources` remain compatibility redirects to the primary routes.

---

## Workbench workflow

```text
Upload drone video
        ↓
Select Thermal / Low-light / RGB
        ↓
Define perimeter (zone + tripwire)
        ↓
Run AI analysis
        ↓
Review detections, tracks, alerts
```

Coordinates drawn on the 800×450 calibration canvas are scaled to native video resolution before inference.

---

## Inference host (optional)

The workbench can POST `multipart/form-data` to:

```text
{INFERENCE_BASE}/api/v1/analytics/full
```

Set a custom host in Settings or via:

```env
NEXT_PUBLIC_AI_SERVICE_URL=YOUR_BACKEND_URL
```

The service URL is never shown in the product UI; Settings reports only the engine connection state.

---

## Tech stack

Next.js · React · CSS (no extra UI framework)

---

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`
>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
