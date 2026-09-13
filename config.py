import os

# This is the ONE place you update once Aurindom gives you the Kaggle tunnel URL.
# Leave it empty for now - the backend will use dummy/simulated detections until this is set.
# You can also set it as an environment variable instead of hardcoding it here.
AI_MODEL_URL = os.getenv("AI_MODEL_URL", "https://partnerships-unnecessary-movie-curves.trycloudflare.com")

# If True, backend generates fake detections so the whole pipeline can be demoed
# even if the real AI model / tunnel isn't reachable.
USE_DUMMY_DETECTION = AI_MODEL_URL == ""
