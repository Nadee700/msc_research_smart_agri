import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os

# Define the CNN model
def build_model(input_shape=(128, 128, 3), num_classes=3):
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        MaxPooling2D((2, 2)),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Flatten(),
        Dense(128, activation='relu'),
        Dense(num_classes, activation='softmax')  # Output layer with softmax for multiclass classification
    ])
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

# Prepare the dataset
def prepare_data(data_dir):
    datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

    train_gen = datagen.flow_from_directory(
        os.path.join(data_dir),
        target_size=(128, 128),
        batch_size=32,
        class_mode='categorical',
        subset='training'
    )

    val_gen = datagen.flow_from_directory(
        os.path.join(data_dir),
        target_size=(128, 128),
        batch_size=32,
        class_mode='categorical',
        subset='validation'
    )
    return train_gen, val_gen

# Train and save the model
def train_and_save_model(data_dir, save_path):
    train_gen, val_gen = prepare_data(data_dir)
    model = build_model(input_shape=(128, 128, 3), num_classes=len(train_gen.class_indices))

    model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=10,
        verbose=1
    )
    model.save(save_path)
    print(f"Model saved to {save_path}")

# Train the model
if __name__ == "__main__":
    data_dir = "../data/images"
    save_path = "../models/cnn_model.h5"
    train_and_save_model(data_dir, save_path)

