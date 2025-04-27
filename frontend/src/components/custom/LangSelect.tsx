import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LangSelect: React.FC = () => {
  const { t, i18n } = useTranslation();
  console.log(t("enter_location")); 
  // Function to change language and save it in localStorage
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("selectedLanguage", lng);
  };

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") || "en"; // Default to 'en'
    i18n.changeLanguage(savedLanguage);
  }, []);

  return (
    <div style={{ textAlign: "center", color: "green", fontWeight:"600"}}>

      {/* Language Selection Dropdown */}
      <label>
        <select
          onChange={(e) => changeLanguage(e.target.value)}
          value={i18n.language} // Keeps the selected value in sync
          style={{ padding: "8px", fontSize: "16px", margin: "10px" }}
        >
          <option value="en"> English </option>
          <option value="si"> සිංහල </option>
          <option value="ta"> தமிழ் </option>
        </select>
      </label>
    </div>
  );
};

export default LangSelect;
