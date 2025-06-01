import { useMapsLibrary } from "@vis.gl/react-google-maps"; // Import useMapsLibrary
import { onValue, ref, set } from "firebase/database";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useFirebase } from "./FirebaseContext";

// Create a context for map data
const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const { db } = useFirebase(); // Access Firebase Realtime Database instance
  const mapsLibrary = useMapsLibrary("maps"); // Initialize the Google Maps library
  const [markers, setMarkers] = useState({
    cameras: [],
    patrols: [],
    incidents: [],
    tatars: []
  });

  const [isEditing, setIsEditing] = useState(false); // Track edit mode
  const [selectedTask, setSelectedTask] = useState(null); // Track the selected task
  const [polyline, setPolyline] = useState(null); // State to store the polyline
  const [selectedIncident, setSelectedIncident] = useState(null); // Add selectedIncident state
  const [selectedCluster, setSelectedCluster] = useState(null); // Add selectedIncident state
  const [initialized, setInitialized] = useState(false); // Track if the context is initialized

  // Add a new marker
  const addMarker = (type, marker) => {
    setMarkers(prev => ({
      ...prev,
      [type]: [...prev[type], marker]
    }));
  };

  // Method to clear the polyline
  const clearPolylines = () => {
    if (polyline) {
      polyline.setMap(null); // Remove the polyline from the map
      setPolyline(null); // Reset the polyline state
    }
    setSelectedTask(null); // Reset the selected task
  };

  // Method to add a polyline
  const addPolylines = (map, routePath) => {
    if (!mapsLibrary || !routePath) return;

    const routePathPolyline = new mapsLibrary.Polyline({
      path: routePath.map(point => ({
        lat: point.coordinates[0],
        lng: point.coordinates[1]
      })), // Convert to Google Maps LatLng format
      geodesic: true,
      strokeColor: "#0F64C6", // Red color for the polyline
      strokeOpacity: 1.0,
      strokeWeight: 3
    });

    // Add the polyline to the map
    routePathPolyline.setMap(map);

    // Store the polyline in the global state
    setPolyline(routePathPolyline);
  };

  // Load cameras markers from localStorage on initialization
  useEffect(() => {
    const storedCameras = localStorage.getItem("cameras");
    if (storedCameras && storedCameras !== "[]") {
      setMarkers(prev => ({
        ...prev,
        cameras: JSON.parse(storedCameras)
      }));
    }
  }, []);

  // Save only cameras markers to localStorage whenever they change
  useEffect(() => {
    if (markers.cameras.length > 0) {
      localStorage.setItem("cameras", JSON.stringify(markers.cameras));
    }
  }, [markers.cameras]);

  // Load patrols and reports from Firebase Realtime Database
  useEffect(() => {
    const patrolsRef = ref(db, "tasks"); // Reference to the "tasks" node
    const reportsRef = ref(db, "reports"); // Reference to the "reports" node
    const tatarsRef = ref(db, "users"); // Reference to the "users" node

    const unsubscribePatrols = onValue(patrolsRef, snapshot => {
      if (snapshot.exists()) {
        const patrolsData = snapshot.val();
        const patrolsArray = Object.keys(patrolsData).map(key => ({
          id: key,
          ...patrolsData[key]
        }));

        setMarkers(prev => ({
          ...prev,
          patrols: patrolsArray // Update patrols in the markers state
        }));
      } else {
        console.log("No patrols found in the database.");
        setMarkers(prev => ({
          ...prev,
          patrols: []
        }));
      }
    });

    const unsubscribeReports = onValue(reportsRef, snapshot => {
      if (snapshot.exists()) {
        const incidentsData = snapshot.val();
        const incidentsArray = Object.keys(incidentsData).map(key => ({
          id: key,
          ...incidentsData[key]
        }));

        setMarkers(prev => ({
          ...prev,
          incidents: incidentsArray // Update incidents in the markers state
        }));
      } else {
        console.log("No incidents found in the database.");
        setMarkers(prev => ({
          ...prev,
          incidents: []
        }));
      }
    });

    const unsubscribeTatars = onValue(tatarsRef, snapshot => {
      if (snapshot.exists()) {
        const tatarsData = snapshot.val();
        const tatarsArray = Object.keys(tatarsData)
          .map(key => ({
            id: key,
            ...tatarsData[key]
          }))
          .filter(tatar => tatar.role === "patrol"); // Filter users with the role "patrol"

        setMarkers(prev => ({
          ...prev,
          tatars: tatarsArray // Update tatars in the markers state
        }));
      } else {
        console.log("No tatars found in the database.");
        setMarkers(prev => ({
          ...prev,
          tatars: []
        }));
      }
    });

    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribePatrols();
      unsubscribeReports();
      unsubscribeTatars();
    };
  }, [db]);

  useEffect(() => {
    // Set initialized to true after the first render
    if (markers.patrols.length > 0 || markers.incidents.length > 0 || markers.tatars.length > 0) {
      setInitialized(true);
    }
  }, [markers.patrols, markers.incidents, markers.tatars]);

  return (
    <MapDataContext.Provider
      value={{
        markers,
        setMarkers,
        isEditing,
        setIsEditing,
        selectedTask,
        setSelectedTask, // Expose selectedTask and its setter
        polyline,
        setPolyline, // Expose polyline and its setter
        clearPolylines, // Expose the clearPolylines method
        addPolylines, // Expose the addPolylines method
        mapsLibrary, // Expose the mapsLibrary
        selectedIncident, // Expose selectedIncident
        setSelectedIncident, // Expose setter for selectedIncident
        addMarker, // Expose the addMarker method
        selectedCluster, // Expose selectedCluster
        setSelectedCluster, // Expose setter for selectedCluster
        initialized, // Expose initialized state
      }}
    >
      {children}
    </MapDataContext.Provider>
  );
};

// Custom hook to use the MapDataContext
export const useMapDataContext = () => useContext(MapDataContext);
