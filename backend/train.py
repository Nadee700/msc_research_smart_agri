import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB2
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, BatchNormalization, Dense, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

# ─── CONFIG ────────────────────────────────────────────────────────────────
TRAIN_DIR = "data/images/train"
VAL_DIR   = "data/images/val"
SAVE_DIR  = "models"
IMG_SIZE  = (224, 224)
BATCH     = 24
EPOCHS    = 45
SEED      = 42
# ────────────────────────────────────────────────────────────────────────────

os.makedirs(SAVE_DIR, exist_ok=True)

# ─── DATA GENERATORS ────────────────────────────────────────────────────────
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=25,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH,
    class_mode='categorical',
    shuffle=True,
    seed=SEED
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH,
    class_mode='categorical',
    shuffle=False
)

# Save class indices
class_indices = train_generator.class_indices
with open(os.path.join(SAVE_DIR, "class_indices.json"), "w") as f:
    json.dump(class_indices, f)
class_names = list(class_indices.keys())

# ─── CLASS WEIGHTS (balanced) ───────────────────────────────────────────────
counts = {}
for idx in train_generator.classes:
    counts[idx] = counts.get(idx, 0) + 1
total = sum(counts.values())
class_weights = {idx: total / (len(counts) * count) for idx, count in counts.items()}
print("Class weights:", class_weights)

# ─── MODEL DEFINITION ───────────────────────────────────────────────────────
base_model = EfficientNetB2(
    weights="imagenet",
    include_top=False,
    input_shape=(*IMG_SIZE, 3)
)
for layer in base_model.layers:
    layer.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dense(448, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.4)(x)
x = Dense(224, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.3)(x)
outputs = Dense(len(class_names), activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=outputs)

# ─── CALLBACKS ──────────────────────────────────────────────────────────────
callbacks = [
    EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.6, patience=5, min_lr=5e-7),
    ModelCheckpoint(
        filepath=os.path.join(SAVE_DIR, 'best_model.h5'),
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
]

# ─── PHASE 1: TRAIN TOP LAYERS ───────────────────────────────────────────────
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)
print("Phase 1: Training top layers...")
model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=15,
    class_weight=class_weights,
    callbacks=callbacks,
    verbose=1
)

# ─── PHASE 2: FINE-TUNING ────────────────────────────────────────────────────
print("Phase 2: Fine-tuning...")
for layer in base_model.layers[-45:]:
    layer.trainable = True

model.compile(
    optimizer=tf.keras.optimizers.Adam(2e-5),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)
model.fit(
    train_generator,
    validation_data=val_generator,
    initial_epoch=15,
    epochs=EPOCHS,
    class_weight=class_weights,
    callbacks=callbacks,
    verbose=1
)

# ─── SAVE FINAL MODEL ───────────────────────────────────────────────────────
model_path = os.path.join(SAVE_DIR, "disease_classifier.h5")
model.save(model_path)
print(f"Training complete — model saved to {model_path}")
