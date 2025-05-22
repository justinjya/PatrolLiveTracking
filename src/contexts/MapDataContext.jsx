import React, { createContext, useState, useContext, useEffect } from "react";

// Create a context for map data
const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const [markers, setMarkers] = useState({
    cameras: [],
    patrols: [],
    incidents: [],
  });

  const [isEditing, setIsEditing] = useState(false); // Track edit mode

  // Load cameras markers from localStorage on initialization
  useEffect(() => {
    const storedCameras = localStorage.getItem("cameras");
    if (storedCameras && storedCameras !== "[]") {
      // Only update state if storedCameras is not empty
      setMarkers((prev) => ({
        ...prev,
        cameras: JSON.parse(storedCameras),
      }));
    }
  }, []);

  // Save only cameras markers to localStorage whenever they change
  useEffect(() => {
    if (markers.cameras.length > 0) {
      // Only save to localStorage if cameras array is not empty
      localStorage.setItem("cameras", JSON.stringify(markers.cameras));
    }
  }, [markers.cameras]);

  // Add a new marker
  const addMarker = (type, marker) => {
    setMarkers((prev) => ({
      ...prev,
      [type]: [...prev[type], marker],
    }));
  };

  return (
    <MapDataContext.Provider
      value={{
        markers,
        setMarkers,
        isEditing,
        setIsEditing,
        addMarker,
      }}
    >
      {children}
    </MapDataContext.Provider>
  );
};

// Custom hook to use the MapDataContext
export const useMapDataContext = () => useContext(MapDataContext);