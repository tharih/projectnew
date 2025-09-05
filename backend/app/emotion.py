from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
from io import BytesIO
from PIL import Image
import numpy as np
import cv2
import mediapipe as mp
from collections import deque
from .auth import get_current_account
from .models import Account

router = APIRouter(prefix="/api/emotion", tags=["emotion"])

mp_face_mesh = mp.solutions.face_mesh
mp_face_detection = mp.solutions.face_detection

HISTORY_SIZE = 200
history = deque(maxlen=HISTORY_SIZE)

LM = { "mouth_left": 61, "mouth_right": 291, "mouth_top": 13, "mouth_bottom": 14, "left_brow": 105, "right_brow": 334, "left_eye_top": 159, "right_eye_top": 386 }

def _dist(a, b): return float(np.linalg.norm(np.array(a) - np.array(b)))

def classify_emotion_from_landmarks(landmarks: np.ndarray) -> Dict[str, float]:
    pts = {name: landmarks[idx][:2] for name, idx in LM.items()}
    mouth_w = _dist(pts["mouth_left"], pts["mouth_right"]) + 1e-6
    mouth_h = _dist(pts["mouth_top"], pts["mouth_bottom"])
    open_ratio = mouth_h / mouth_w
    lb_dist = abs(pts["left_brow"][1] - pts["left_eye_top"][1])
    rb_dist = abs(pts["right_brow"][1] - pts["right_eye_top"][1])
    brow_eye = (lb_dist + rb_dist) / 2.0

    surprise = 3.0 * open_ratio + 2.0 * brow_eye
    happy = max(0.0, 1.0 - abs(open_ratio - 0.25)) + 0.5 * max(0.0, brow_eye - 0.02)
    angry = max(0.0, 0.25 - open_ratio) + max(0.0, 0.03 - brow_eye)
    sad = max(0.0, 0.2 - open_ratio) + max(0.0, 0.02 - brow_eye)
    neutral = 0.5

    scores = { "Surprised": surprise, "Happy": happy, "Angry": angry, "Sad": sad, "Neutral": neutral }
    vals = np.array(list(scores.values()), dtype=np.float64)
    exp = np.exp(vals - np.max(vals)); probs = exp / (exp.sum() + 1e-9)
    return {k: float(p) for k, p in zip(scores.keys(), probs)}

def decode_image(file_bytes: bytes) -> np.ndarray:
    img = Image.open(BytesIO(file_bytes)).convert("RGB")
    return np.array(img)

@router.post("/detect")
async def detect_emotion(image: UploadFile = File(...), _: Account = Depends(get_current_account)) -> Any:
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload an image file.")
    file_bytes = await image.read()
    frame_rgb = decode_image(file_bytes)
    h, w, _ = frame_rgb.shape

    results_payload: List[Dict[str, Any]] = []
    with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=5, refine_landmarks=True, min_detection_confidence=0.5) as face_mesh:
        mesh = face_mesh.process(frame_rgb)
        if not mesh.multi_face_landmarks:
            with mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as fd:
                det = fd.process(frame_rgb)
                if det.detections:
                    for d in det.detections:
                        b = d.location_data.relative_bounding_box
                        bbox = { "x": int(b.xmin * w), "y": int(b.ymin * h), "width": int(b.width * w), "height": int(b.height * h) }
                        results_payload.append({ "bbox": bbox, "top_emotion": "Neutral", "probabilities": {"Neutral": 1.0} })
        else:
            for face_landmarks in mesh.multi_face_landmarks:
                pts = np.array([(lm.x, lm.y, lm.z) for lm in face_landmarks.landmark], dtype=np.float32)
                probs = classify_emotion_from_landmarks(pts)
                top_emotion = max(probs, key=probs.get)
                xs = pts[:,0] * w; ys = pts[:,1] * h
                x1, y1, x2, y2 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
                bbox = {"x": x1, "y": y1, "width": int(x2 - x1), "height": int(y2 - y1)}
                results_payload.append({ "bbox": bbox, "top_emotion": top_emotion, "probabilities": probs })

    for r in results_payload: history.append(r["top_emotion"])
    agg = {}; [agg.__setitem__(e, agg.get(e,0)+1) for e in history]
    return JSONResponse({"faces": results_payload, "history": agg})

@router.get("/history")
def get_history(_: Account = Depends(get_current_account)):
    agg = {}; [agg.__setitem__(e, agg.get(e,0)+1) for e in history]
    return {"history": agg, "size": len(history)}
