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
