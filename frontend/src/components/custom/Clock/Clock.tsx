import React, { useState, useEffect } from "react";
import WeatherComponent from "../WeatherComponent";
import { useResult } from "@/contexts/ResultContext";

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const { weatherInfo } = useResult();
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-row gap-4 max-w-full" style={{ height: "40px" }}>
      <div className=" flex-1" style={{ width: "30%", minWidth: "180px" }}>
        <p className="ext-sm font-bold text-gray-800">
          Date: &nbsp;&nbsp; {time.toLocaleDateString()} {/* Date */}
        </p>
        <p className="text-sm font-mono text-blue-600">
          Time: {time.toLocaleTimeString()} {/* Time with seconds */}
        </p>
      </div>

      <div className="" style={{ width: "40%", height: "20px" }}>
        <WeatherComponent />
      </div>

      <div className="" style={{ width: "50%", height: "4px" }}>
        <p className="text-sm font-mono text-black-600">
          Colombo, Sri Lanka <br />
          {weatherInfo?.current?.condition?.text}
        </p>
      </div>
    </div>
  );
};

export default Clock;
