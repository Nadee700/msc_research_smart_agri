# Import required libraries
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB2, MobileNetV2
from tensorflow.keras.applications.efficientnet import preprocess_input as eff_preprocess
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mob_preprocess
from tensorflow.keras.layers import GlobalAveragePooling2D, BatchNormalization, Dense, Dropout, Average
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.utils import Sequence

# Custom data loader to send the same input to both models
class DualInputSequence(Sequence):
    def __init__(self, generator):
        self.generator = generator

    def __len__(self):
        return len(self.generator)

    def __getitem__(self, index):
        x, y = self.generator[index]
        return (x, x), y  # send same image to both models

    def on_epoch_end(self):
        self.generator.on_epoch_end()

# Set folder paths and image settings
TRAIN_DIR = "data/images/train"
VAL_DIR   = "data/images/val"
SAVE_DIR  = "models"
IMG_SIZE  = (224, 224)  # image size
BATCH     = 24          # images per batch
EPOCHS    = 45          # total training cycles
SEED      = 42          # for reproducibility

# Create models folder if it doesn't exist
os.makedirs(SAVE_DIR, exist_ok=True)

# Set up image augmentations for training (rotate, zoom, flip, etc.)
datagen_args = dict(
    preprocessing_function=eff_preprocess,
    rotation_range=25,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2],
    fill_mode='nearest'
)

# Create generators for training and validation data
train_datagen = ImageDataGenerator(**datagen_args)
val_datagen = ImageDataGenerator(preprocessing_function=eff_preprocess)

# Load training images
train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH,
    class_mode='categorical',
    shuffle=True,
    seed=SEED
)

# Load validation images
val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH,
    class_mode='categorical',
    shuffle=False
)

# Save class labels to a JSON file (e.g., {'banana': 0, 'mango': 1, ...})
class_indices = train_generator.class_indices
with open(os.path.join(SAVE_DIR, "class_indices.json"), "w") as f:
    json.dump(class_indices, f)
class_names = list(class_indices.keys())

# Calculate class weights to balance data (optional, just printed)
counts = {}
for idx in train_generator.classes:
    counts[idx] = counts.get(idx, 0) + 1
total = sum(counts.values())
class_weights = {idx: total / (len(counts) * count) for idx, count in counts.items()}
print("Class weights:", class_weights)

# Create one model branch using given architecture (EfficientNet or MobileNet)
def build_branch(base_model_fn, name):
    base = base_model_fn(
        weights="imagenet",         # use pre-trained weights
        include_top=False,          # remove default classification layer
        input_shape=(*IMG_SIZE, 3)  # input image size
    )
    base.trainable = False         # freeze model for now
    x = base.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dense(448, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(224, activation='relu')(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    out = Dense(len(class_names), activation='softmax', name=name)(x)
    return base.input, out, base

# Build two separate model branches (EfficientNet and MobileNet)
eff_input, eff_output, eff_base = build_branch(EfficientNetB2, "EffNet_Output")
mob_input, mob_output, mob_base = build_branch(MobileNetV2, "MobNet_Output")

# Combine both model outputs into one (average of both)
combined_output = Average()([eff_output, mob_output])
ensemble_model = Model(inputs=[eff_input, mob_input], outputs=combined_output)

# Setup callbacks to help training
callbacks = [
    EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),  # stop early if no improvement
    ReduceLROnPlateau(monitor='val_loss', factor=0.6, patience=5, min_lr=5e-7), # lower learning rate if stuck
    ModelCheckpoint(                                                            # save best model
        filepath=os.path.join(SAVE_DIR, 'best_ensemble_model.h5'),
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
]

# Wrap image generators to send input to both models
train_seq = DualInputSequence(train_generator)
val_seq = DualInputSequence(val_generator)

# Phase 1: Train only the added layers (not the pre-trained models yet)
ensemble_model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)
print("Phase 1: Training ensemble top layers...")
ensemble_model.fit(
    train_seq,
    validation_data=val_seq,
    epochs=15,
    callbacks=callbacks,
    verbose=1
)

# Phase 2: Unfreeze the last 45 layers of each model and continue training
print("Phase 2: Fine-tuning ensemble...")
for layer in eff_base.layers[-45:]:
    layer.trainable = True
for layer in mob_base.layers[-45:]:
    layer.trainable = True

ensemble_model.compile(
    optimizer=tf.keras.optimizers.Adam(2e-5),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)
ensemble_model.fit(
    train_seq,
    validation_data=val_seq,
    initial_epoch=15,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

# Save the final trained model
model_path = os.path.join(SAVE_DIR, "ensemble_disease_classifier.h5")
ensemble_model.save(model_path)
print(f"Ensemble model saved at: {model_path}")
