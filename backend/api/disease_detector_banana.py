import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input
import cv2

# ─── PATHS & SETTINGS ────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(__file__)
MODEL_DIR   = os.path.abspath(os.path.join(BASE_DIR, "..", "models"))
MODEL_FP    = os.path.join(MODEL_DIR, "ensemble_disease_classifier.h5")
IDX_FP      = os.path.join(MODEL_DIR, "class_indices_banana.json")
IMG_SIZE    = (224, 224)

# ─── LOAD MODEL & CLASS MAP ──────────────────────────────────────────────────
print(f"Loading ensemble model from {MODEL_FP}")
model = tf.keras.models.load_model(MODEL_FP)

with open(IDX_FP) as f:
    cls2idx = json.load(f)
idx2cls = {v: k for k, v in cls2idx.items()}

# ─── UTILITIES ───────────────────────────────────────────────────────────────
def humanize(label: str) -> str:
    if label == "Banana_Healthy":
        return "No disease, the banana is healthy"
    return label.replace("_", " ")

def preprocess_image(path: str):
    """Load, resize, and apply CLAHE to image."""
    img = load_img(path, target_size=IMG_SIZE)
    arr = img_to_array(img).astype("uint8")

    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    merged = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)

    return arr, enhanced

def predict_disease_banana(image_path: str, crop: str = "Banana"):
    """Return (human_readable_label, confidence, crop)."""
    original, enhanced = preprocess_image(image_path)

    inp = preprocess_input(enhanced.astype("float32"))
    inp = np.expand_dims(inp, axis=0)

    # Ensemble input expects [EffNet_input, MobNet_input]
    probs = model.predict([inp, inp])[0]

    # Debug: Show top-3 predictions
    top3 = np.argsort(probs)[-3:][::-1]
    print("\nTop 3 predictions:")
    for i in top3:
        print(f"- {idx2cls[i]}: {probs[i]:.2%}")

    idx = int(np.argmax(probs))
    label = idx2cls[idx]
    name = humanize(label)
    conf = float(probs[idx])

    # Fallback logic: double-check if wrongly low-confidence disease
    if label != "Banana_Healthy" and conf < 0.65:
        hsv = cv2.cvtColor(original, cv2.COLOR_RGB2HSV)
        mask = cv2.inRange(hsv, (35, 50, 50), (85, 255, 255))
        green_ratio = np.sum(mask) / (mask.size * 255)

        gray = cv2.cvtColor(original, cv2.COLOR_RGB2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        sx = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
        sy = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
        edge_intensity = np.mean(np.sqrt(sx**2 + sy**2))

        print(f"Image analysis — Green ratio: {green_ratio:.3f}, Edge intensity: {edge_intensity:.3f}")

        healthy_idx = cls2idx.get("Banana_Healthy", -1)
        if (
            green_ratio > 0.60 and
            edge_intensity < 18 and
            healthy_idx in top3 and
            probs[healthy_idx] > 0.25
        ):
            idx = healthy_idx
            label = "Banana_Healthy"
            name = humanize(label)
            conf = float(probs[healthy_idx])
            print("🔁 Overridden as Healthy due to visual cues")

    print(f"→ Final prediction: {name} @ {conf:.2%}")
    return name, conf, crop

# ─── CLI SUPPORT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        predict_disease(sys.argv[1])
    else:
        print("Usage: python disease_detector.py [path_to_image]")
