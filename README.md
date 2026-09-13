<<<<<<< HEAD
# SkySentinel — Drone Border Surveillance Intelligence

SkySentinel is an AI-powered drone surveillance system designed for border security and perimeter monitoring. It helps operators detect suspicious human movement, evaluate behavioral intent, and identify wildlife activity in protected zones using aerial video analysis.

The system is built for real-time situational awareness in challenging border environments, with emphasis on human detection, posture-aware recognition, and anomaly detection for both security and environmental context.

---

## Core mission

SkySentinel supports proactive border surveillance by combining:

- drone-based aerial video monitoring
- restricted-zone and tripwire analysis
- person detection in difficult terrain and low-visibility conditions
- human posture and motion interpretation
- intent detection for suspicious behavior
- wildlife detection for ecological monitoring and false-alarm reduction

---

## Key features

| Feature | Description |
|---|---|
| Border surveillance monitoring | Detects suspicious activity inside monitored perimeter zones and along border crossings |
| Human detection | Identifies people from aerial footage in multiple conditions |
| Crouching detection | Recognizes crouched or low-profile movement that may indicate concealment |
| Walking detection | Tracks ordinary and suspicious human gait patterns from drone imagery |
| Proning detection | Detects prone or lying postures used to evade monitoring or conceal movement |
| Intent detection | Flags suspicious behavioral intent based on movement patterns, transits, and context around restricted zones |
| Wildlife detection | Identifies animal movement to distinguish benign field activity from human threats |
| Zone and tripwire analysis | Evaluates activity crossing virtual perimeter boundaries or trigger lines |
| Explainable alerting | Surfaces detections and risk signals for operator review |
| Drone video workflow | Supports upload, calibration, detection, and review within a surveillance dashboard |

---

## Detection capabilities

SkySentinel is designed to detect and interpret the following patterns from drone video:

- crouching human movement
- walking persons
- prone/lying human postures
- suspicious movement near secure boundaries
- intent-driven activity patterns near restricted or monitored areas
- wildlife presence in the same surveillance frame

This combination helps operators reduce false positives while identifying potentially dangerous movement in real time.

---

## Dataset training foundation

The project is aligned with real-world aerial surveillance datasets used for training and benchmarking:

- HIT-UAV dataset
- RGBTDronePerson dataset
- BIRDSAI dataset

These datasets support model development for:

- human detection in aerial imagery
- low-light and thermal-aware perception
- person tracking under dynamic drone motion
- wildlife monitoring and background separation
- improved border-security scene understanding

---

## Project pages

```text
/                 Overview
/drone-surveillance Drone surveillance workbench
/alerts            Alerts and incidents
/datasets-models   Dataset and model references
/settings         Surveillance configuration
```

---

## Workbench workflow

```text
Upload drone footage
        ↓
Choose camera mode / scene context
        ↓
Define border perimeter and tripwires
        ↓
Run AI analysis
        ↓
Review detections, alerts, and motion context
```

Coordinates defined on the 800×450 calibration canvas are scaled to the native video resolution before inference.

---

## Inference host (optional)

The workbench can send `multipart/form-data` payloads to a configured inference endpoint.

```text
{INFERENCE_BASE}/api/v1/analytics/full
```

Set a custom host in Settings or define:

```env
NEXT_PUBLIC_AI_SERVICE_URL=YOUR_BACKEND_URL
```

---

## Tech stack

Next.js · React · CSS

---

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Environment configuration

Create a `.env.local` file and define your AI service endpoint if needed:

```env
NEXT_PUBLIC_AI_SERVICE_URL=YOUR_BACKEND_URL
```

---

## Project goal

SkySentinel is built to support modern border surveillance by combining aerial computer vision, human activity understanding, and contextual threat assessment in a single operational workflow.

It is focused on detecting unusual movement, interpreting posture and intent, and distinguishing human activity from wildlife in monitored border regions.

>>>>>>> b6eb656b72cfc4e65cc3e6a1b073b902d864de98
