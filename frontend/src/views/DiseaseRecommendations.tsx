import React from "react";

interface IApiResponse {
  result: string;
  status: boolean;
  server_code: number;
}

interface IDiseaseRecommendations {
  disease_name: string;
  crop_type: string;
  recommendations: string[];
}

interface Props {
  responseString: string;
}

const DiseaseRecommendations: React.FC<Props> = ({ responseString }) => {
  try {
    // 1. Parse the outer API response
    const parsedResponse = JSON.parse(responseString) as IApiResponse;

    // 2. Extract the raw text that contains the disease recommendation data
    const resultText = parsedResponse.result;

    // 3. Parse the disease recommendation data (which is a stringified JSON inside the `result`)
    const diseaseData: IDiseaseRecommendations = JSON.parse(resultText);

    // 4. Render the data
    return (
      <div className="p-3 space-y-5">
        <h2 className="text-2xl font-bold underline">Disease Information</h2>

        <div>
          <h3 className="text-lg font-semibold text-yellow-700">Crop Type:</h3>
          <p>{diseaseData.crop_type}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-yellow-700">Disease Name:</h3>
          <p>{diseaseData.disease_name}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-red-500">Recommendations:</h3>
          {diseaseData.recommendations.length === 0 ? (
            <p>No recommendations provided.</p>
          ) : (
            <ul className="list-disc list-inside">
              {diseaseData.recommendations.map((recommendation, idx) => (
                <li key={idx}>{recommendation}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch (error) {
    // If there's any JSON parsing or other error
    console.error("Error parsing the disease data:", error);
    return <div>Failed to parse disease information.</div>;
  }
};

export default DiseaseRecommendations;
