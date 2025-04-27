import { Card } from '@/components/ui';
import React from 'react';

/**
 * Interfaces for the weather data structure
 * (Optional but recommended for TypeScript)
 */
interface WeatherCondition {
  code: number;
  icon: string;
  text: string;
}

interface CurrentWeather {
  temp_c: number;
  temp_f: number;
  feelslike_c: number;
  feelslike_f: number;
  condition: WeatherCondition;
  wind_kph: number;
  wind_mph: number;
  humidity: number;
  cloud: number;
  last_updated: string;
  [key: string]: any; // for any other fields you might not have typed
}

interface AstroData {
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  moon_phase: string;
  [key: string]: any;
}

interface DayData {
  maxtemp_c: number;
  maxtemp_f: number;
  mintemp_c: number;
  mintemp_f: number;
  avgtemp_c: number;
  avgtemp_f: number;
  condition: WeatherCondition;
  [key: string]: any;
}

interface HourData {
  time: string;
  temp_c: number;
  temp_f: number;
  condition: WeatherCondition;
  chance_of_rain: number;
  [key: string]: any;
}

interface ForecastDay {
  date: string;
  day: DayData;
  astro: AstroData;
  hour: HourData[];
}

interface Forecast {
  forecastday: ForecastDay[];
}

interface LocationData {
  name: string;
  region: string;
  country: string;
  tz_id: string;
  localtime: string;
  [key: string]: any;
}

interface WeatherData {
  location: LocationData;
  current: CurrentWeather;
  forecast: Forecast;
}

/**
 * Component Props
 */
interface WeatherWidgetProps {
  weather: WeatherData;
}

/**
 * The main WeatherWidget component
 */
const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather }) => {
  const { location, current, forecast } = weather;

  // Optionally, you could safely check for existence of these fields
  // if there's uncertainty about the shape of the data.

  return (
    <Card> 
      {/* Location & Time */}
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold">{location.name}</h2>
        <p className="text-sm text-gray-500">{location.region}, {location.country}</p>
        <p className="text-sm text-gray-400">Local time: {location.localtime}</p>
      </div>

      {/* Current Weather */}
      <div className="flex items-center justify-between bg-lime-50 rounded-lg p-4 mt-3">
        <div className="flex items-center space-x-2">
          <img
            className="w-14 h-14"
            src={`https:${current.condition.icon}`}
            alt={current.condition.text}
          />
          <div>
            <p className="text-lg font-bold">{current.temp_c}°C</p>
            <p className="text-sm text-gray-600">{current.condition.text}</p>
            <p className="text-xs text-gray-500">
              Feels like: {current.feelslike_c}°C
            </p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p>Wind: {current.wind_kph} kph</p>
          <p>Humidity: {current.humidity}%</p>
          <p>Cloud: {current.cloud}%</p>
          <p className="text-gray-400 text-xs">
            Last updated: {current.last_updated}
          </p>
        </div>
      </div>

      {/* Forecast (just showing next 3 days for example) */}
      <div>
        <h3 className="text-lg font-semibold mb-2 mt-2">3-Day Forecast</h3>
        <div className="grid gap-4">
          {forecast.forecastday.slice(0, 3).map((day) => (
            <div
              key={day.date}
              className="border rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="font-bold">{day.date}</p>
                <p className="text-sm text-gray-600">
                  {day.day.condition.text}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Avg Temp:</span>{" "}
                  {day.day.avgtemp_c}°C
                </p>
                <p className="text-sm">
                  <span className="font-medium">Min/Max:</span>{" "}
                  {day.day.mintemp_c}°C / {day.day.maxtemp_c}°C
                </p>
              </div>
              <img
                className="w-10 h-10"
                src={`https:${day.day.condition.icon}`}
                alt={day.day.condition.text}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default WeatherWidget;
