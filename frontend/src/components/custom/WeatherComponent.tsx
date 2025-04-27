import { useResult } from '@/contexts/ResultContext';
import React, { useState, useEffect } from 'react';

interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_kph: number;
    humidity: number;
    feelslike_c: number;
  };
}

const WeatherComponent: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { weatherInfo, setWeatherInfo } = useResult();

  // Replace with your actual key and desired location
  const API_KEY = '56e319dc3dc24818a9c182747251801';
  const location = 'Colombo';

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${location}&aqi=no`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data: WeatherData = await response.json();
        setWeatherData(data);
        setWeatherInfo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [API_KEY, location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-red-600">{`Error: ${error}`}</span>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-1 ">
      <div className="flex items-center space-x-2 mb-12 pb-2">
        <img
          src={weatherData?.current.condition.icon}
          alt={weatherData?.current.condition.text}
          className="w-12 h-12"
        />
        <div className="text-xl font-bold">{weatherData?.current.temp_c}°C</div>
      </div>
    </div>
  );
};

export default WeatherComponent;
