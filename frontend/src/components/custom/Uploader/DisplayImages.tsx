import React, { useEffect, useState } from "react";
import axios from "axios";

const DisplayImages: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/get-images");
        setImages(res.data.images);
      } catch (err) {
        console.error(err);
      }
    };
    fetchImages();
  }, []);

  console.log(images,"rrrrrr");
  
  return (
    <div>
      <h3>Uploaded Images</h3>
      <ul>
        {images.map((img) => (
          <li key={img.id}>
            <p>{img.filename}</p>
            <img src={`http://127.0.0.1:5000/${img.filepath}`} alt={img.filename} width="400" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DisplayImages;
