import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "chatgpt-42.p.rapidapi.com")
RAPIDAPI_URL  = os.getenv("RAPIDAPI_URL", "https://chatgpt-42.p.rapidapi.com/conversationllama3")

COMMON_HEADERS = {
    "x-rapidapi-key": RAPIDAPI_KEY or "",
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type": "application/json",
}

def _post_chat(payload: dict) -> dict:
    """Low-level helper to call the RapidAPI endpoint and return JSON or raise."""
    if not RAPIDAPI_KEY:
        raise RuntimeError("RAPIDAPI_KEY is missing. Check your .env")
    try:
        resp = requests.post(RAPIDAPI_URL, headers=COMMON_HEADERS, data=json.dumps(payload), timeout=60)
    except requests.RequestException as e:
        raise RuntimeError(f"Network error calling RapidAPI: {e}") from e

    # RapidAPI sometimes returns 200 for provider errors, so check body as well.
    try:
        data = resp.json()
    except ValueError:
        raise RuntimeError(f"Non-JSON response (status {resp.status_code}): {resp.text[:500]}")

    # If provider sends a message indicating bad path or similar, surface it.
    if isinstance(data, dict) and data.get("message", "").lower().startswith("endpoint"):
        raise RuntimeError(f"Provider error: {data.get('message')} (Check RAPIDAPI_URL path)")

    return data

def generate_recommendations(weather_data, crop_type, lang="en"):
    system_content = (
        "You are ChatGPT, an expert agronomist that strictly returns valid JSON. "
        "No extra explanations. No disclaimers. Return only the 'risks' and 'recommendations' arrays. "
        "The language for 'risks' and 'recommendations' should match the language code 'lang' provided."
    )
    user_content = (
        f"I have a {crop_type} crop with weather data: {weather_data}.\n\n"
        "Identify possible weather-related risks in a 'risks' array, and provide management strategies in a "
        "'recommendations' array. Return ONLY valid JSON of the form:\n"
        "{\n"
        '  "risks": ["..."],\n'
        '  "recommendations": ["..."]\n'
        "}\n\n"
        f"Respond in the language specified by lang='{lang}'."
    )

    payload = {
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
        "web_access": False
    }

    data = _post_chat(payload)

    # Many RapidAPI “chat” wrappers return the model’s text in fields like "result" or "content".
    # Try a few common shapes before falling back.
    text = (data.get("result")
            or data.get("content")
            or data.get("message")
            or (data.get("choices", [{}])[0].get("message", {}).get("content"))
            or "")

    # If the provider already returned the JSON dict, keep it; otherwise parse the text.
    if isinstance(data, dict) and ("risks" in data and "recommendations" in data):
        return {"risks": data["risks"], "recommendations": data["recommendations"]}

    try:
        parsed = json.loads(text)
        return {
            "risks": parsed.get("risks", []),
            "recommendations": parsed.get("recommendations", []),
        }
    except Exception:
        # If the model didn’t comply, return safe defaults
        return {"risks": [], "recommendations": []}

def get_disease_recommendations(disease_name, crop_type):
    system_content = (
        "You are ChatGPT, an expert agronomist that provides disease-specific recommendations and tips "
        "based on the disease name and crop type. Return ONLY valid JSON as instructed."
    )
    user_content = (
        f"I have a {crop_type} crop affected by {disease_name}. Provide disease management strategies and "
        "tips specific to this disease and crop type. Return ONLY valid JSON in the following format:\n"
        "{\n"
        '  "disease_name": "...",\n'
        '  "crop_type": "...",\n'
        '  "recommendations": ["..."]\n'
        "}\n\n"
        "No text outside the JSON object."
    )

    payload = {
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ],
        "web_access": False
    }

    data = _post_chat(payload)

    text = (data.get("result")
            or data.get("content")
            or data.get("message")
            or (data.get("choices", [{}])[0].get("message", {}).get("content"))
            or "")

    # If the provider already returned the JSON dict, keep it; otherwise parse the text.
    if isinstance(data, dict) and all(k in data for k in ("disease_name", "crop_type", "recommendations")):
        return {
            "disease_name": data.get("disease_name", disease_name),
            "crop_type": data.get("crop_type", crop_type),
            "recommendations": data.get("recommendations", []),
        }

    try:
        parsed = json.loads(text)
        return {
            "disease_name": parsed.get("disease_name", disease_name),
            "crop_type": parsed.get("crop_type", crop_type),
            "recommendations": parsed.get("recommendations", []),
        }
    except Exception:
        return {"disease_name": disease_name, "crop_type": crop_type, "recommendations": []}
