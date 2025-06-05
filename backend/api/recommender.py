import http.client
import json
import os
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")

HEADERS = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
    'Content-Type': "application/json"
}

# generate recomednations based on weather calling the function get_crop_recommendations
def generate_recommendations(weather_data, crop_type, lang="en"):
    system_content = (
        "You are ChatGPT, an expert agronomist that strictly returns valid JSON. "
        "No extra explanations. No disclaimers. Return only the 'risks' and 'recommendations' arrays. "
        "The language for 'risks' and 'recommendations' should match the language code 'lang' provided. "
        "For example, if lang is 'en', return the response in English, if lang is 'si', return in Sinhala, etc."
    )

    user_content = (
        f"I have a {crop_type} crop with weather data: {weather_data}.\n\n"
        "Identify possible weather-related risks in a 'risks' array, and provide management strategies in a "
        "'recommendations' array. Return ONLY valid JSON of the form:\n"
        "{\n"
        "  \"risks\": [\"...\"],\n"
        "  \"recommendations\": [\"...\"]\n"
        "}\n\n"
        "No text outside of that JSON object and send in {lang} language"
    )

    payload = json.dumps({
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content}
        ],
        "web_access": False
    })


    conn = http.client.HTTPSConnection(RAPIDAPI_HOST)
    conn.request("POST", "/conversationllama", payload, HEADERS)
    res = conn.getresponse()
    data = res.read()
    conn.close()

    raw_response = data.decode("utf-8")
    # print("RAW RESPONSE:", raw_response)  # Debug: see what actually comes back

    # Attempt to parse ChatGPT's response
    try:
        api_response = json.loads(raw_response)
    except json.JSONDecodeError:
        print("Error: Unable to parse ChatGPT response as JSON.")
        return {"risks": [], "recommendations": []}

    if isinstance(api_response, dict):
        risks = api_response.get('risks', [])
        recommendations = api_response.get('recommendations', [])
        return raw_response
    else:
        print("Error: Response is not a dict or doesn't contain expected keys.")
        return {"risks": [], "recommendations": []}



# New function to get disease-specific recommendations
def get_disease_recommendations(disease_name, crop_type):
    system_content = (
        "You are ChatGPT, an expert agronomist that provides disease-specific recommendations and tips "
        "based on the disease name and crop type."
    )

    user_content = (
        f"I have a {crop_type} crop affected by {disease_name}. Provide disease management strategies and "
        "tips specific to this disease and crop type. Return ONLY valid JSON in the following format:\n"
        "{\n"
        "  \"disease_name\": \"...\",\n"
        "  \"crop_type\": \"...\",\n"
        "  \"recommendations\": [\"...\"]\n"
        "}\n\n"
        "No extra text outside the JSON object."
    )

    payload = json.dumps({
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content}
        ],
        "web_access": False
    })

    conn = http.client.HTTPSConnection(RAPIDAPI_HOST)
    conn.request("POST", "/conversationllama", payload, HEADERS)
    res = conn.getresponse()
    data = res.read()
    conn.close()

    raw_response = data.decode("utf-8")
    print("RAW RESPONSE:", raw_response)  # Debug: see what actually comes back

    # Attempt to parse ChatGPT's response
    try:
        api_response = json.loads(raw_response)
    except json.JSONDecodeError:
        print("Error: Unable to parse ChatGPT response as JSON.")
        return {"disease_name": disease_name, "crop_type": crop_type, "recommendations": []}

    if isinstance(api_response, dict):
        disease_name = api_response.get('disease_name', disease_name)
        crop_type = api_response.get('crop_type', crop_type)
        recommendations = api_response.get('recommendations', [])
        return raw_response
    else:
        print("Error: Response is not a dict or doesn't contain expected keys.")
        return {"disease_name": disease_name, "crop_type": crop_type, "recommendations": []}
