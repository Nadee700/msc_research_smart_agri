import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array, load_img
import numpy as np

MODEL_PATH = "../models/cnn_model.h5"
LABELS = {0: 'Healthy', 1: 'Leaf Spot', 2: 'Anthracnose'}

# Load pre-trained model
model = tf.keras.models.load_model(MODEL_PATH)

def predict_disease(image_file, crop):
    """
    Predicts the disease in the given crop image and returns the disease name.
    
    Args:
    - image_file (str): Path to the image file.
    - crop (str): Type of the crop (e.g., "Tomato" or "Banana").
    
    Returns:
    - disease_name (str): The predicted disease name (e.g., 'Healthy', 'Leaf Spot', 'Anthracnose').
    - confidence (float): Confidence score of the prediction.
    - crop (str): The type of crop (e.g., 'Tomato' or 'Banana').
    """
    # Load and preprocess the image
    image = load_img(image_file, target_size=(128, 128))
    image_array = img_to_array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)
    
    # Predict the disease
    predictions = model.predict(image_array)
    
    # Debugging: Print predictions for each class
    print("Raw predictions:", predictions)
    
    # Find the class with the highest confidence
    max_index = np.argmax(predictions)
    
    # Get the predicted disease and confidence
    disease_name = LABELS[max_index]
    confidence = float(predictions[0][max_index])  # Convert to float for JSON serialization
    
    # Debugging: Print the chosen disease and confidence
    print(f"Predicted disease: {disease_name} with confidence: {confidence:.2f}")
    
    return disease_name, confidence, crop