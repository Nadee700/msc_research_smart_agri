import Card from "@/components/ui/Card";
import Upload from "@/components/ui/Upload";
import { FcImageFile } from "react-icons/fc";
import {
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { Progress } from "@/components/ui";
import { HiCheckCircle, HiXCircle } from "react-icons/hi";
import { useResult } from "@/contexts/ResultContext";
import DiseaseRecommendations from "./DiseaseRecommendations";
import { useTranslation } from "react-i18next";

// 1) Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

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

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [crop, setCrop] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();
  // This boolean state will control which button to show
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Use your existing context
  const { result, setResult } = useResult();

  // ================================================
  // 2) Load persisted data from LocalStorage on mount
  // ================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLocation = localStorage.getItem("location");
      if (storedLocation) setLocation(storedLocation);

      const storedCrop = localStorage.getItem("crop");
      if (storedCrop) setCrop(storedCrop);

      const storedBase64Image = localStorage.getItem("base64Image");
      if (storedBase64Image) {
        setBase64Image(storedBase64Image);
        setImageUrl(storedBase64Image);
      }

      const storedResult = localStorage.getItem("result");
      if (storedResult) {
        setResult(JSON.parse(storedResult));
        // If we had a previous result, it means we *submitted* once before
        setSubmitted(true);
      }
    }
  }, [setResult]);

  // ================================================
  // 2b) Persist data to LocalStorage whenever they change
  // ================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("location", location);
    }
  }, [location]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crop", crop);
    }
  }, [crop]);

  useEffect(() => {
    if (typeof window !== "undefined" && base64Image) {
      localStorage.setItem("base64Image", base64Image);
    }
  }, [base64Image]);

  useEffect(() => {
    if (typeof window !== "undefined" && result) {
      localStorage.setItem("result", JSON.stringify(result));
    }
  }, [result]);

  // ================================================
  // When user uploads file
  // ================================================
  const handleFileChange = async (files: any[]) => {
    if (files.length > 0) {
      const fileUploaded = files[0];
      setFile(fileUploaded);

      // Create a local preview for the UI
      const localPreviewUrl = URL.createObjectURL(fileUploaded);
      setImageUrl(localPreviewUrl);

      // Convert file to base64 for persistence
      const base64 = await fileToBase64(fileUploaded);
      setBase64Image(base64);
    }
  };

  // Clean up URL object when unmounting
  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  // ================================================
  // SUBMIT (Get Recommendations)
  // ================================================
  const handleSubmit = async () => {
    if (!file || !location) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("location", location);
      formData.append("crop", crop);

      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResult(response.data);
      // Once we have a result, we've "submitted"
      setSubmitted(true);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image.");
    }
    setLoading(false);
  };

  // ================================================
  // RESET (Clear everything and go back to initial state)
  // ================================================
  const handleReset = () => {
    setFile(null);
    setBase64Image(null);
    setImageUrl(null);
    setLocation("");
    setCrop("");
    setResult(null);
    setSubmitted(false);

    // Clear localStorage
    localStorage.removeItem("location");
    localStorage.removeItem("crop");
    localStorage.removeItem("base64Image");
    localStorage.removeItem("result");
  };

  const recoData = (reco: any) => {
    if (!reco) return null;
    const parsedResponse = JSON.parse(reco) as IApiResponse;
    const resultText = parsedResponse?.result;
    const diseaseData: IDiseaseRecommendations = JSON.parse(resultText);
    return diseaseData;
  };

  const renderProgress = () => {
    if (!result) return null;
    const confidence = parseFloat(result.confidence.replace("%", ""));
    const isSuccess = result.disease === "No disease, the banana is healthy";

    return (
      <Progress
        customColorClass={isSuccess ? "bg-green-500" : "bg-red-500"}
        percent={confidence}
        customInfo={
          isSuccess ? (
            <HiCheckCircle className="text-emerald-500 text-xl" />
          ) : (
            <HiXCircle className="text-red-500 text-xl" />
          )
        }
      />
    );
  };

  return (
    <>
      <div
        className="flex flex-row gap-4 max-w-full"
        style={{ height: "600px" }}
      >
        {/* LEFT COLUMN */}
        <div
          className="flex-1 flex flex-col items-center"
          style={{ width: "33%", minWidth: "300px" }}
        >
          <Card className="bg-white text-center border-none p-6">
            {/* — Grid Rows: Label on left, Field on right */}
            <div className="grid grid-cols-2 gap-x-4 items-center mb-6">
              <label className="text-ml font-bold text-left">
                Your Location
              </label>
              <input
                type="text"
                placeholder="Enter your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
  
            <div className="grid grid-cols-2 gap-x-4 items-center mb-12">
              <label className="text-ml font-bold text-left">
                Select your crop type
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="crop"
                    value="banana"
                    checked={crop === "banana"}
                    onChange={(e) => setCrop(e.target.value)}
                    className="radio radio-neutral"
                  />
                  <span>Banana 🍌</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="crop"
                    value="tomato"
                    checked={crop === "tomato"}
                    onChange={(e) => setCrop(e.target.value)}
                    className="radio radio-primary"
                  />
                  <span>Tomato 🍅</span>
                </label>
              </div>
            </div>
  
            {/* Image Upload */}
            <Upload draggable uploadLimit={1} onChange={handleFileChange}>
              <div className="text-center p-4">
                <FcImageFile className="text-5xl mb-4" />
                <p className="font-semibold">
                  <span>Drop your image here, or </span>
                  <span className="text-blue-500">browse</span>
                </p>
                <p className="opacity-60">Support: jpeg, png, gif</p>
              </div>
            </Upload>
  
            {/* Action Buttons */}
            {!submitted ? (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  className="py-2 px-4 bg-green-600 font-bold text-white rounded"
                  onClick={handleSubmit}
                >
                  {t("get_recommendations")}
                </button>
                <button
                  className="py-2 px-4 bg-yellow-600 font-bold text-white rounded"
                  onClick={handleReset}
                >
                  {t("reset_results")}
                </button>
              </div>
            ) : (
              <div className="flex justify-center mt-6">
                <button
                  className="py-2 px-4 bg-yellow-600 font-bold text-white rounded"
                  onClick={handleReset}
                >
                  {t("reset_results")}
                </button>
              </div>
            )}
          </Card>
        </div>
  
        {/* MIDDLE COLUMN */}
        {imageUrl && (
          <div className="flex-1" style={{ width: "33%", minWidth: "300px" }}>
            <Card>
              <h5>{t("image_preview")}</h5>
              <br />
              <img
                src={imageUrl}
                alt="Uploaded Image"
                style={{ width: "100%", height: "auto", maxHeight: "250px" }}
              />
              <br />
              <h6>{t("disease_type")}</h6>
              <br />
              {loading ? <p>Loading...</p> : renderProgress()}
              {result && (
                <p>
                  {recoData(result.disease_recomendations)?.disease_name} –{" "}
                  {result.confidence}
                </p>
              )}
              <br />
            </Card>
          </div>
        )}
  
        {/* RIGHT COLUMN */}
        {result && (
          <div className="flex-1" style={{ width: "33%", minWidth: "300px" }}>
            <Card>
              <DiseaseRecommendations
                responseString={result.disease_recomendations}
              />
            </Card>
          </div>
        )}
      </div>
    </>
  );
  
};

export default Home;
