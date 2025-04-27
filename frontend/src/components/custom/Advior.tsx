import { useResult } from "@/contexts/ResultContext";
import axios from "axios";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const WeatherAdvice: React.FC = () => {
  const { result } = useResult();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const { i18n } = useTranslation(); 
  const handleSubmit = async () => {
    setLoading(true);

    // ---- Prepare your form data as before ----
    const dataToSend = JSON.parse(JSON.stringify(result?.weather));
    delete dataToSend.current;
    if (dataToSend?.forecast?.forecastday) {
      dataToSend.forecast.forecastday.forEach((dayObj: any) => {
        delete dayObj.hour;
        delete dayObj.day.condition;
      });
    }
    const weatherJson = JSON.stringify(dataToSend);

    const formData = new FormData();
    formData.append("weather_data", weatherJson);
    formData.append("crop", result?.crop_type);
    formData.append("lang", i18n?.language || "en"); // Add this line

    try {
      const response = await axios.post("http://127.0.0.1:5000/recommendations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Raw server response:", response.data);

      // Save entire server response into state
      setData(response.data);
    } catch (error) {
      console.error("Error uploading data:", error);
      alert("Failed to upload data.");
    }

    setLoading(false);
  };

  // --- PARSING the data from the server ---
  let risks: string[] = [];
  let recommendations: string[] = [];

  if (data && data.recommendations) {
    try {
      // 1. Parse data.recommendations (the first layer)
      const recObj = JSON.parse(data.recommendations); 
      // recObj => { result: "...", status: true, server_code: 1 }

      // 2. Parse recObj.result (the second layer)
      const inner = JSON.parse(recObj.result);
      // inner => { risks: [...], recommendations: [...] }

      risks = inner.risks || [];
      recommendations = inner.recommendations || [];
    } catch (err) {
      console.error("Error parsing nested JSON:", err);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-gray-500">Weather-Related Advisory</h2>

      {loading && <p>Loading...</p>}

      {!loading && data && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-green-600">Crop Risk Analysis</h3>
            <h6 className="text-md font-semibold text-red-500 mb-2">High Risk Alerts!</h6>
            <ul className="list-disc list-inside ml-4">
              {risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-red-400">Recommendations Actions</h3>
            <ul className="list-disc list-inside ml-4">
              {recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <button className="mt-4 py-2 px-4 font-bold bg-green-600 text-white rounded" onClick={handleSubmit}>
        Get Recommendations
      </button>
    </div>
  );
};

export default WeatherAdvice;
