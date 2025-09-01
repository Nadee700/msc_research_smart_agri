import React from "react";

interface Props {
  responseString: string; // raw string from API
}

type FinalObj = {
  disease_name?: string;
  crop_type?: string;
  recommendations?: unknown;
};

function coerceRecommendations(input: unknown): string[] {
  // If it's a JSON string, try to parse it
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return coerceRecommendations(parsed);
    } catch {
      // If it's a plain string, return as single-item array
      return [input];
    }
  }

  // If it’s already an array of strings, use it
  if (Array.isArray(input)) {
    return input.filter((x) => typeof x === "string");
  }

  // If it’s an object that contains a nested recommendations array
  if (input && typeof input === "object" && "recommendations" in (input as any)) {
    const nested = (input as any).recommendations;
    return coerceRecommendations(nested);
  }

  return [];
}

const DiseaseRecommendations: React.FC<Props> = ({ responseString }) => {
  try {
    // Layer 0: outer API wrapper
    const layer0 = JSON.parse(responseString) as {
      result?: unknown;
      status?: boolean;
      server_code?: number;
    };

    // The provider puts the actual content in "result" (string or object)
    const resultRaw = layer0?.result;

    // Layer 1: result can be a stringified JSON or already an object
    const layer1: FinalObj =
      typeof resultRaw === "string" ? JSON.parse(resultRaw) : (resultRaw as FinalObj);

    const disease_name =
      layer1?.disease_name ??
      (layer1 as any)?.diseaseName ??
      "Unknown disease";

    const crop_type =
      layer1?.crop_type ??
      (layer1 as any)?.cropType ??
      "Unknown crop";

    const recommendations = coerceRecommendations(layer1?.recommendations);

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
