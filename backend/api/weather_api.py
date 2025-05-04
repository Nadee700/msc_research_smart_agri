import requests

API_KEY = '56e319dc3dc24818a9c182747251801'

def get_weather(location):
    url = f"http://api.weatherapi.com/v1/forecast.json?key={API_KEY}&q={location}&days=3&aqi=no&alerts=no"
    response = requests.get(url)
    print(response)
    if response.status_code == 200:
        forecast_data = response.json()
        return {
            'location': forecast_data.get('location', {}),
            'current': forecast_data.get('current', {}),
            'forecast': forecast_data.get('forecast', {})
        }
    else:
        return {
            'error': 'Failed to fetch weather data',
            'status_code': response.status_code,
            'response_body': response.text  # This will show the response body which often includes the reason for failure
        }  