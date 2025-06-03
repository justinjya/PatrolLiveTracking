import React, { useEffect, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import Input from "../Input/Input";
import "./AddMarkerInfoWindow.css";

function AddMarkerInfoWindow({ position, closeInfoWindow }) {
  const { setMarkers } = useMapDataContext(); // Access setMarkers from context to update markers state
  const [isAddingMarker, setIsAddingMarker] = useState(false); // Track whether the dropdown is visible
  const [markerName, setMarkerName] = useState(""); // Track the marker name input
  const [isFormValid, setIsFormValid] = useState(false); // Track form validity

  useEffect(() => {
    // Check if all required fields are filled
    setIsFormValid(markerName.trim() !== "");
  }, [markerName]);

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    const newMarker = {
      id: Date.now().toString(), // Use current timestamp as a unique ID
      name: markerName.trim(), // Use trimmed marker name
      lat: position.lat,
      lng: position.lng
    };
    setMarkers(prev => ({
      ...prev,
      cameras: [...prev.cameras, newMarker] // Add the new marker to the cameras array
    })); // Update the markers state with the new marker
    closeInfoWindow(); // Close the InfoWindow
  };

  return (
    <div className="add-marker-info-window">
      {!isAddingMarker ? (
        <button className="add-marker-button" onClick={() => setIsAddingMarker(true)}>
          Tambah Titik
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="add-marker-form">
          <Input
            type="input"
            id="marker-name"
            name="marker-name"
            placeholder="Marker Name"
            required
            value={markerName}
            onChange={e => setMarkerName(e.target.value)} // Update marker name state
          />
          <button type="submit" disabled={!isFormValid}>
            Simpan Titik
          </button>
        </form>
      )}
    </div>
  );
}

export default AddMarkerInfoWindow;
