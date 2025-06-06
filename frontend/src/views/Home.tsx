import Card from "@/components/ui/Card";
import Upload from "@/components/ui/Upload";
import { FcImageFile } from "react-icons/fc";
import { useEffect, useState } from "react";
import axios from "axios";
import { Progress } from "@/components/ui";
import { HiCheckCircle, HiXCircle } from "react-icons/hi";
import { useResult } from "@/contexts/ResultContext";
import DiseaseRecommendations from "./DiseaseRecommendations";
import { useTranslation } from "react-i18next";

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

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
  const { t } = useTranslation();
  const { result, setResult } = useResult();

  const [file, setFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("Kandy");
  const [crop, setCrop] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // validation errors
  const [errors, setErrors] = useState<{
    location?: string;
    crop?: string;
    file?: string;
  }>({});

  // Load persisted data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sLoc = localStorage.getItem("location");
    if (sLoc) setLocation(sLoc);
    const sCrop = localStorage.getItem("crop");
    if (sCrop) setCrop(sCrop);
    const sImg = localStorage.getItem("base64Image");
    if (sImg) {
      setBase64Image(sImg);
      setImageUrl(sImg);
    }
    const sRes = localStorage.getItem("result");
    if (sRes) {
      setResult(JSON.parse(sRes));
      setSubmitted(true);
    }
  }, [setResult]);

  // Persist to localStorage when values change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("location", location);
  }, [location]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("crop", crop);
  }, [crop]);

  useEffect(() => {
    if (typeof window === "undefined" || !base64Image) return;
    localStorage.setItem("base64Image", base64Image);
  }, [base64Image]);

  useEffect(() => {
    if (typeof window === "undefined" || !result) return;
    localStorage.setItem("result", JSON.stringify(result));
  }, [result]);

  // Handle file selection & clear file error
  const handleFileChange = async (files: any[]) => {
    if (!files.length) return;
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setBase64Image(await fileToBase64(f));
    if (errors.file) setErrors(prev => ({ ...prev, file: undefined }));
  };

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Submit handler with validation
  const handleSubmit = async () => {
    const newErrors: typeof errors = {};

    // Location: required & letters only
    if (!location.trim()) {
      newErrors.location = "Location is required";
    } else if (!/^[A-Za-z ]+$/.test(location.trim())) {
      newErrors.location = "Location must contain letters only";
    }

    // Crop: required
    if (!crop) {
      newErrors.crop = "Please select a crop type";
    }

    // Image: either file upload or persisted base64 must exist
    if (!file && !base64Image) {
      newErrors.file = "Please upload an image";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("image", file);
      } else {
        // fall back to base64 string
        formData.append("image", base64Image as string);
      }
      formData.append("location", location);
      formData.append("crop", crop);

      const response = await axios.post<IApiResponse>(
        "http://127.0.0.1:5000/predict",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(response.data);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to upload image.";
      alert(msg);
    }
    setLoading(false);
  };

  // Reset all state & localStorage
  const handleReset = () => {
    setFile(null);
    setBase64Image(null);
    setImageUrl(null);
    setLocation("");
    setCrop("");
    setResult(null);
    setSubmitted(false);
    setErrors({});
    localStorage.removeItem("location");
    localStorage.removeItem("crop");
    localStorage.removeItem("base64Image");
    localStorage.removeItem("result");
  };

  // Parse recommendation data
  const recoData = (reco: any): IDiseaseRecommendations | null => {
    if (!reco) return null;
    const parsed = JSON.parse(reco) as IApiResponse;
    return JSON.parse(parsed.result) as IDiseaseRecommendations;
  };

  // Render progress bar
  const renderProgress = () => {
    if (!result) return null;
    const confidence = parseFloat(result.confidence.replace("%", ""));
    const isHealthy =
      result.disease === "No disease, the banana is healthy" || result.disease === "No disease, the Tomato is healthy";
    return (
      <Progress
        customColorClass={isHealthy ? "bg-green-500" : "bg-red-500"}
        percent={confidence}
        customInfo={
          isHealthy ? (
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
            {/* Location Row */}
            <div className="grid grid-cols-2 gap-x-4 items-center mb-6">
              <label className="text-ml font-bold text-left">
                Your Location 📍
              </label>
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="Enter your location"
                  value={location}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLocation(v);
                    if (
                      errors.location &&
                      (/^[A-Za-z ]*$/.test(v) || !v.trim())
                    ) {
                      setErrors((prev) => ({
                        ...prev,
                        location: undefined,
                      }));
                    }
                  }}
                  className="input input-bordered w-full"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.location}
                  </p>
                )}
              </div>
            </div>

            {/* Crop Row */}
            <div className="grid grid-cols-2 gap-x-4 items-center mb-12">
              <label className="text-ml font-bold text-left">
                Select your crop type
              </label>
              <div className="flex flex-col">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="crop"
                      value="banana"
                      checked={crop === "banana"}
                      onChange={(e) => {
                        setCrop(e.target.value);
                        if (errors.crop) {
                          setErrors((prev) => ({
                            ...prev,
                            crop: undefined,
                          }));
                        }
                      }}
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
                      onChange={(e) => {
                        setCrop(e.target.value);
                        if (errors.crop) {
                          setErrors((prev) => ({
                            ...prev,
                            crop: undefined,
                          }));
                        }
                      }}
                      className="radio radio-primary"
                    />
                    <span>Tomato 🍅</span>
                  </label>
                </div>
                {errors.crop && (
                  <p className="text-red-500 text-sm mt-1">{errors.crop}</p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-12 w-99flex flex-col items-center">
              <Upload
                draggable
                uploadLimit={1}
                onChange={handleFileChange}
              >
                <div className="text-center p-4">
                  <FcImageFile className="text-5xl mb-4" />
                  <p className="font-semibold">
                    <span>Drop your image here, or </span>
                    <span className="text-blue-500">browse</span>
                  </p>
                  <p className="opacity-60">Support: jpeg, png, gif</p>
                </div>
              </Upload>
              {errors.file && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.file}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {!submitted ? (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  className="py-2 px-4 bg-green-600 font-bold text-white rounded disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {t("get_recommendations")}
                </button>
                <button
                  className="py-2 px-4 bg-yellow-600 font-bold text-white rounded"
                  onClick={handleReset}
                  disabled={loading}
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
          <div
            className="flex-1"
            id="preview"
            style={{ width: "33%", minWidth: "300px" }}
          >
            <Card>
              <h5>{t("image_preview")}</h5>
              <br />
              <img
                src={imageUrl}
                alt="Uploaded Image"
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "250px",
                }}
              />
              <br />
              <h6>{t("disease_type")}</h6>
              <br />
              {loading ? <p>Loading...</p> : renderProgress()}
              {result && (
                <p>
                  {recoData(result.disease_recomendations)
                    ?.disease_name}{" "}
                  – {result.confidence}
                </p>
              )}
              <br />
            </Card>
          </div>
        )}

        {/* RIGHT COLUMN */}
        {result && (
          <div
            className="flex-1"
            style={{ width: "33%", minWidth: "300px" }}
          >
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
