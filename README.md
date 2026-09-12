# SentryX Backend

## Kya hai ye

Ye backend hai jo Sonakshi ke frontend (SentryX) se connect hoga. Video + zone
coordinates leta hai, detection chalata hai, result database mein save karta
hai, aur frontend ko wapas bhejta hai.

## Files (kya kaam karti hai)

| File | Kaam |
|---|---|
| `main.py` | Saare API endpoints yahan hain. Sabse important file. |
| `models.py` | Database tables define karti hai (VideoSession, Detection, Alert, Drone). |
| `database.py` | SQLite database se connect karne ka setup. |
| `detection.py` | **Sirf ye file change hogi** jab real YOLO model ready ho. Abhi dummy/fake detections deta hai. |
| `config.py` | Yahan Kaggle tunnel ka URL daalna hai jab mile (`AI_MODEL_URL`). |

## Kaise chalayein

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Phir browser mein: `http://127.0.0.1:8000/docs` — yahan saare endpoints test
kar sakte ho, bina frontend ke bhi.

## Main endpoint

`POST /api/analyze` — video file + zones (JSON) leta hai, detection chalata
hai, breach count + alerts + incident report wapas deta hai. Ye wahi endpoint
hai jo frontend ke `NEXT_PUBLIC_IBVAP_API_BASE_URL` se call hoga.

## Jab real AI model (YOLO) ready ho jaye

1. `config.py` mein `AI_MODEL_URL` set karo (Kaggle tunnel ka link)
2. `detection.py` mein `_call_real_model()` function ko complete karo
   (example code already comment mein diya hai)
3. Baaki kuch change nahi karna — `main.py`, database, sab waisa hi rahega
