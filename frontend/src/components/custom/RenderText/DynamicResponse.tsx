import React from 'react';

interface DynamicResponseProps {
  response: string;
}

const DynamicResponse: React.FC<DynamicResponseProps> = ({ response }) => {
  return (
    <div className="m-5 p-5 border border-gray-300 rounded-lg bg-gray-100 overflow-auto max-h-96">
      <h2 className="text-center text-lg text-gray-800">Care Tips</h2>
      {/* Dynamically create paragraphs for each section of the response */}
      {response?.split('\n\n').map((paragraph, index) => (
        <p key={index} className="text-justify leading-relaxed my-2">
          {paragraph}
        </p>
      ))}
    </div>
  );
};

export default DynamicResponse;
