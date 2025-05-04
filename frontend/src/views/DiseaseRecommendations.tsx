import React from "react";

interface Props {
  responseString: string;  // the raw `disease_recomendations` string from the API
}

const DiseaseRecommendations: React.FC<Props> = ({ responseString }) => {
  try {
    console.log(responseString, "responseString");
    
    // 1) Parse the outermost API wrapper
    //    {"result":"{...}","status":true,"server_code":200}
    const layer0 = JSON.parse(responseString);

    // 2) layer0.result is itself a JSON string:
    //    {"disease_name":"...","crop_type":"...","recommendations":"{...}"}
    const layer1 = JSON.parse(layer0.result);

    // 3) layer1.recommendations is *again* a JSON string:
    //    {"result":"{...}","status":true,"server_code":"dg"}
    const layer2 = JSON.parse(layer1.recommendations);

    // 4) layer2.result finally contains the real object:
    //    {"disease_name":"...","crop_type":"...","recommendations":[ "...", "...", ... ]}
    const finalObj = JSON.parse(layer2.result) as {
      disease_name: string;
      crop_type: string;
      recommendations: string[];
    };

    const { disease_name, crop_type, recommendations } = finalObj;

    return (
      <div className="p-3 space-y-5">
        <h2 className="text-2xl font-bold underline">Disease Information</h2>
        <div>
          <h3 className="text-lg font-semibold text-yellow-700">Crop Type:</h3>
          <p>{crop_type}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-yellow-700">Disease Name:</h3>
          <p>{disease_name}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-500">Recommendations:</h3>
          {recommendations.length === 0 ? (
            <p>No recommendations provided.</p>
          ) : (
            <ul className="list-disc list-inside">
              {recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error("Error parsing the disease data:", err);
    return <div>Failed to parse disease information.</div>;
  }
};

export default DiseaseRecommendations;
