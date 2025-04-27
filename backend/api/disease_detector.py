import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input
import cv2

# ─── PATHS & SETTINGS ────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(__file__)
MODEL_DIR     = os.path.abspath(os.path.join(BASE_DIR, "..", "models"))
BEST_MODEL_FP = os.path.join(MODEL_DIR, "best_model.h5")
MODEL_FP      = os.path.join(MODEL_DIR, "disease_classifier.h5")
IDX_FP        = os.path.join(MODEL_DIR, "class_indices.json")
IMG_SIZE      = (224, 224)
# ────────────────────────────────────────────────────────────────────────────

# ─── LOAD MODEL ──────────────────────────────────────────────────────────────
if os.path.exists(BEST_MODEL_FP):
    print(f"Loading best model from {BEST_MODEL_FP}")
    model = tf.keras.models.load_model(BEST_MODEL_FP)
else:
    print(f"Loading model from {MODEL_FP}")
    model = tf.keras.models.load_model(MODEL_FP)

with open(IDX_FP) as f:
    cls2idx = json.load(f)
idx2cls = {v: k for k, v in cls2idx.items()}

def humanize(label: str) -> str:
    if label == "Banana_Healthy":
        return "No disease, the banana is healthy"
    return label.replace("_", " ")

def preprocess_image(path: str):
    """Load, resize, and apply CLAHE."""
    img = load_img(path, target_size=IMG_SIZE)
    arr = img_to_array(img).astype("uint8")

    # CLAHE on L-channel
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    merged = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)

    return arr, enhanced

def predict_disease(image_path: str, crop: str = "Banana"):
    """Return (human_readable_label, confidence, crop)."""
    original, enhanced = preprocess_image(image_path)

    inp = preprocess_input(enhanced.astype("float32"))
    inp = np.expand_dims(inp, axis=0)
    probs = model.predict(inp)[0]

    # Debug: top-3
    top3 = np.argsort(probs)[-3:][::-1]
    print("\nTop 3 predictions:")
    for i in top3:
        print(f"- {idx2cls[i]}: {probs[i]:.2%}")

    idx = int(np.argmax(probs))
    label = idx2cls[idx]
    name  = humanize(label)
    conf  = float(probs[idx])

    # Fallback check for low-confidence non-healthy
    if label != "Banana_Healthy" and conf < 0.6:
        hsv = cv2.cvtColor(original, cv2.COLOR_RGB2HSV)
        mask = cv2.inRange(hsv, (35, 50, 50), (85, 255, 255))
        green_ratio = np.sum(mask) / (mask.size * 255)

        gray = cv2.cvtColor(original, cv2.COLOR_RGB2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        sx = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
        sy = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
        edge_intensity = np.mean(np.sqrt(sx**2 + sy**2))

        print(f"Image analysis—Green ratio: {green_ratio:.3f}, Edge intensity: {edge_intensity:.3f}")

        healthy_idx = cls2idx.get("Banana_Healthy", -1)
        if (
            green_ratio > 0.6 and
            edge_intensity < 20 and
            healthy_idx in top3 and
            probs[healthy_idx] > 0.25
        ):
            idx   = healthy_idx
            label = "Banana_Healthy"
            name  = humanize(label)
            conf  = float(probs[healthy_idx])

    print(f"→ Final prediction: {name} @ {conf:.2%}\n")
    return name, conf, crop

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        predict_disease(sys.argv[1])
    else:
        print("Usage: python disease_detector.py [path_to_image]")
