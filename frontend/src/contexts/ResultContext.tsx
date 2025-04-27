import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
  } from "react";
  
  // Define a shape for the context value
  interface ResultContextProps {
    result: any;
    setResult: Dispatch<SetStateAction<any>>;
    weatherInfo: any;
    setWeatherInfo: Dispatch<SetStateAction<any>>;
  }
  
  export const ResultContext = createContext<ResultContextProps>({
    result: null,
    setResult: () => {},
    weatherInfo: null,
    setWeatherInfo: () => {},
  });
  
  // Create a provider component
  export const ResultProvider = ({ children }: { children: ReactNode }) => {
    const [result, setResult] = useState<any>(null);
    const [weatherInfo, setWeatherInfo] = useState<any>(null);

    return (
      <ResultContext.Provider value={{ result, setResult, weatherInfo, setWeatherInfo }}>
        {children}
      </ResultContext.Provider>
    );
  };
  
  // Optional: Create a custom hook for easier usage
  export const useResult = () => useContext(ResultContext);
  