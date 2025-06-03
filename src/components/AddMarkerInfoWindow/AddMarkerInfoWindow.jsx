import { push, ref, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import { useFirebase } from "../../contexts/FirebaseContext";
import Input from "../Input/Input";
import "./AddMarkerInfoWindow.css";

function AddMarkerInfoWindow({ position, closeInfoWindow }) {
  const { db } = useFirebase(); // Access setMarkers from context to update markers state
  const [isAddingMarker, setIsAddingMarker] = useState(false); // Track whether the dropdown is visible
  const [markerName, setMarkerName] = useState(""); // Track the marker name input
  const [isFormValid, setIsFormValid] = useState(false); // Track form validity

  useEffect(() => {
    // Check if all required fields are filled
    setIsFormValid(markerName.trim() !== "");
  }, [markerName]);

  const handleSubmit = async event => {
    event.preventDefault(); // Prevent default form submission behavior

    const newMarker = {
      name: markerName.trim(), // Use trimmed marker name
      lat: position.lat,
      lng: position.lng
    };

    try {
      const camerasRef = ref(db, "cameras"); // Reference to the "cameras" document in Firebase
      const newCameraRef = push(camerasRef);
      await set(newCameraRef, newMarker);
    } catch (error) {
      console.error("Error adding marker to Firebase:", error);
    }

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
