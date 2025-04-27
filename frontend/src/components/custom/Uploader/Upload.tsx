import React, { DragEvent, FC } from 'react';

interface UploadProps {
  onFileSelect: (file: File | null) => void; // Mandatory callback for file selection
  draggable?: boolean; // Optional: Drag-and-drop functionality
  children: React.ReactNode; // Elements to render inside the component
  className?: string; // Optional: Additional CSS classes
}

const Upload: FC<UploadProps> = ({ onFileSelect, draggable = false, children, className }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]); // Pass selected file to the callback
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]); // Pass dropped file to the callback
      e.dataTransfer.clearData();
    }
  };

  return (
    <div
      className={`border-dashed border-2 border-gray-300 rounded-lg p-4 ${className || ''}`}
      onDrop={draggable ? handleDrop : undefined}
      onDragOver={draggable ? (e) => e.preventDefault() : undefined}
      onDragLeave={draggable ? (e) => e.preventDefault() : undefined}
    >
      <input
        type="file"
        id="file-upload"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {children}
      </label>
    </div>
  );
};

export default Upload;
