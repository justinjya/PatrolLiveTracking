import React, { createContext, useState, useContext, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { useFirebase } from "./FirebaseContext";

// Create a context for map data
const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const { db } = useFirebase(); // Access Firebase Realtime Database instance
  const [markers, setMarkers] = useState({
    cameras: [],
    patrols: [], // Add patrols to the markers state
    incidents: [],
  });

  const [isEditing, setIsEditing] = useState(false); // Track edit mode
  const [selectedTask, setSelectedTask] = useState(null); // Track the selected task

  // Load cameras markers from localStorage on initialization
  useEffect(() => {
    const storedCameras = localStorage.getItem("cameras");
    if (storedCameras && storedCameras !== "[]") {
      setMarkers((prev) => ({
        ...prev,
        cameras: JSON.parse(storedCameras),
      }));
    }
  }, []);

  // Save only cameras markers to localStorage whenever they change
  useEffect(() => {
    if (markers.cameras.length > 0) {
      localStorage.setItem("cameras", JSON.stringify(markers.cameras));
    }
  }, [markers.cameras]);

  // Subscribe to real-time updates for patrols
  useEffect(() => {
    const patrolsRef = ref(db, "tasks"); // Reference to the "tasks" node

    const unsubscribe = onValue(patrolsRef, (snapshot) => {
      if (snapshot.exists()) {
        const patrolsData = snapshot.val();
        const patrolsArray = Object.keys(patrolsData).map((key) => ({
          id: key,
          ...patrolsData[key],
        }));

        setMarkers((prev) => ({
          ...prev,
          patrols: patrolsArray, // Update patrols in the markers state
        }));
      } else {
        console.log("No patrols found in the database.");
        setMarkers((prev) => ({
          ...prev,
          patrols: [],
        }));
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [db]);

  return (
    <MapDataContext.Provider
      value={{
        markers,
        setMarkers,
        isEditing,
        setIsEditing,
        selectedTask,
        setSelectedTask, // Expose selectedTask and its setter
      }}
    >
      {children}
    </MapDataContext.Provider>
  );
};

// Custom hook to use the MapDataContext
export const useMapDataContext = () => useContext(MapDataContext);