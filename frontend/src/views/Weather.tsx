/** Example purpose only */
import { useResult } from "@/contexts/ResultContext";
import WeatherWidget from "../components/custom/WeatherWidget";
import WeatherAdvice from "../components/custom/Advior";
import { Card } from "@/components/ui";

const CollapseMenuItemView1 = () => {
  const { result, setResult } = useResult();

  return (
    <div className="flex flex-row gap-4 max-w-full" style={{ height: "600px" }}>
      <div className="flex-1" style={{ width: "50%", minWidth: "300px" }}>
        <Card> {result && <WeatherWidget weather={result?.weather} />} </Card>
      </div>
      <div className="flex-1" style={{ width: "50%", minWidth: "300px" }}>
        <Card>
          <WeatherAdvice />
        </Card>
      </div>
    </div>
  );
};

export default CollapseMenuItemView1;
