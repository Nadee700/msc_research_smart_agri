import io
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from disease_detector import predict_disease
from weather_api import get_weather
from recommender import generate_recommendations
from recommender import get_disease_recommendations
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Allowed extensions for image files
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp'}

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    image = request.files['image']
    
    if image.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(image.filename):
        return jsonify({'error': f"Unsupported file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    # Secure the filename
    filename = secure_filename(image.filename)

    try:
        # Convert the image to bytes for prediction
        image_bytes = io.BytesIO(image.read())

        # Check if crop type is provided
        if 'crop' not in request.form:
            return jsonify({'error': 'Crop type is required'}), 400
        crop_type = request.form['crop']

        # Predict the disease
        disease_name, confidence, crop = predict_disease(image_bytes, crop_type)
        print(disease_name)
        # Get location (default to 'Colombo' if not provided)
        location = request.form.get('location', 'Colombo')

        # Fetch weather data for the location
        weather_data = get_weather(location)

        result = get_disease_recommendations(disease_name, crop_type)

        return jsonify({
            'crop_type': crop_type,
            'disease': disease_name,
            'confidence': "{:.2f}%".format(confidence * 100),
            'weather': weather_data,
            'disease_recomendations': result
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/recommendations', methods=['POST'])
def get_crop_recommendations():
    try:
        # Get crop type and weather data from request
        if 'crop' not in request.form or 'weather_data' not in request.form:
            return jsonify({'error': 'Crop type and weather data are required'}), 400

        crop_type = request.form['crop']
        weather_data = request.form['weather_data']  # This should be in JSON format
        lang = request.form.get('lang', 'en') 

        # Generate recommendations based on crop type and weather data
        recommendations = generate_recommendations(weather_data, crop_type, lang)
        return jsonify({
            'crop': crop_type,
            'recommendations': recommendations
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)


