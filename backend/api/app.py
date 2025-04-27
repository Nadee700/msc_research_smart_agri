# app.py
import io, json, traceback
from flask             import Flask, request, jsonify
from flask_cors        import CORS
from werkzeug.utils    import secure_filename

from disease_detector  import predict_disease
from weather_api       import get_weather
from recommender       import get_disease_recommendations

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

ALLOWED = {'png','jpg','jpeg','bmp','gif'}
def allowed_file(fn):
    return '.' in fn and fn.rsplit('.',1)[1].lower() in ALLOWED

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify(error="No image provided"),400
        img = request.files['image']
        if img.filename=='' or not allowed_file(img.filename):
            return jsonify(error="Invalid image"),400

        buf  = io.BytesIO(img.read())
        crop = request.form.get('crop', "")[:50]

        disease_name, confidence, _ = predict_disease(buf, crop)
        location = request.form.get('location','Colombo')
        weather  = get_weather(location)

        # get raw list of recomms
        rec_list = get_disease_recommendations(disease_name, crop)

        # FE expects a string to JSON.parse twice:
        #    JSON.parse(disease_recomendations).result → JSON string
        #    JSON.parse(that).disease_name, etc.
        inner = {
            "disease_name": disease_name,
            "crop_type":    crop,
            "recommendations": rec_list
        }
        api_resp = {
            "result":      json.dumps(inner),
            "status":      True,
            "server_code": 200
        }

        return jsonify({
            "crop_type":               crop,
            "disease":                 disease_name,
            "confidence":              f"{confidence*100:.2f}%",
            "weather":                 weather,
            "disease_recomendations":  json.dumps(api_resp)
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify(error=str(e)),500

if __name__ == '__main__':
    app.run(debug=True)
