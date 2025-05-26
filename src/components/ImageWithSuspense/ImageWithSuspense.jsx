import React, { useState } from "react";
import "./ImageWithSuspense.css"; // Import the CSS file for animations

function ImageWithSuspense({ src, alt }) {
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  const handleImageLoad = () => {
    setIsLoading(false); // Set loading to false when the image is loaded
  };

  return (
    <div style={{ position: "relative", width: "113px", height: "200px" }}>
      {isLoading && (
        <div className="flashing-box"></div> // Flashing box placeholder
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleImageLoad} // Trigger when the image is loaded
        style={{
          display: isLoading ? "none" : "block", // Hide the image while loading
          maxWidth: "113px",
          height: "200px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
        }}
      />
    </div>
  );
}

export default ImageWithSuspense;