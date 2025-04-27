# preprocess.py
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2, EfficientNetB0
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model
import os, json

def build_model(base_model, num_classes):
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.3)(x)
    preds = Dense(num_classes, activation='softmax')(x)
    model = Model(inputs=base_model.input, outputs=preds)
    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def prepare_data(data_dir, target_size=(128,128), batch_size=32):
    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True
    )
    train_gen = datagen.flow_from_directory(
        data_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        subset='training'
    )
    val_gen = datagen.flow_from_directory(
        data_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        subset='validation'
    )
    return train_gen, val_gen

def train_and_save(data_dir, save_dir):
    os.makedirs(save_dir, exist_ok=True)
    train_gen, val_gen = prepare_data(data_dir)

    # Save class_indices
    with open(os.path.join(save_dir, "class_indices.json"), "w") as f:
        json.dump(train_gen.class_indices, f)

    num_classes = len(train_gen.class_indices)

    # MobileNetV2
    mbase = MobileNetV2(weights='imagenet', include_top=False, input_shape=(128,128,3))
    mmodel = build_model(mbase, num_classes)
    mmodel.fit(train_gen, validation_data=val_gen, epochs=10, verbose=1)
    mmodel.save(os.path.join(save_dir, "mobilenetv2_model.h5"))

    # EfficientNet-B0
    ebase = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(128,128,3))
    emodel = build_model(ebase, num_classes)
    emodel.fit(train_gen, validation_data=val_gen, epochs=10, verbose=1)
    emodel.save(os.path.join(save_dir, "efficientnetb0_model.h5"))

if __name__ == "__main__":
    DATA_DIR = "../data/images"
    SAVE_DIR = "../models"
    train_and_save(DATA_DIR, SAVE_DIR)
