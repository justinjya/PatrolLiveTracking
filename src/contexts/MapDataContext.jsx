import { useMapsLibrary } from "@vis.gl/react-google-maps"; // Import useMapsLibrary
import { onValue, ref } from "firebase/database";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useFirebase } from "./FirebaseContext";

// Create a context for map data
const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const { db } = useFirebase(); // Access Firebase Realtime Database instance
  const [markers, setMarkers] = useState({
    cameras: [],
    patrols: [],
    incidents: []
  });

  const [todayIncidents, setTodayIncidents] = useState([]); // State to store today's incidents
  const [isEditing, setIsEditing] = useState(false); // Track edit mode
  const [selectedTask, setSelectedTask] = useState(null); // Track the selected task
  const [polyline, setPolyline] = useState(null); // State to store the polyline
  const mapsLibrary = useMapsLibrary("maps"); // Initialize the Google Maps library
  const [selectedIncident, setSelectedIncident] = useState(null); // Add selectedIncident state

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
      strokeColor: "#FF0000", // Red color for the polyline
      strokeOpacity: 1.0,
      strokeWeight: 2
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

        // Filter incidents that happened today using plain JavaScript
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); // Start of today
        const endOfToday = startOfToday + 86400000 - 1; // End of today (start of tomorrow minus 1 millisecond)

        // const filteredIncidents = incidentsArray.filter(
        //   (incident) =>
        //     incident.timestamp >= startOfToday && incident.timestamp <= endOfToday
        // );

        // === FOR TESTING, UNCOMMENT CODE ABOVE AFTER ===
        const filteredIncidents = incidentsArray; // Uncomment this line to see all incidents

        // Filter incidents based on the timestamp
        // const startOfRange = new Date("2025-05-23T00:00:00").getTime(); // Start of May 23, 2025
        // const endOfRange = new Date("2025-05-24T23:59:59.999").getTime(); // End of May 25, 2025       
        // const filteredIncidents = incidentsArray.filter(incident => {
        //   const incidentTimestamp = new Date(incident.timestamp).getTime(); // Parse ISO 8601 timestamp
        //   return incidentTimestamp >= startOfRange && incidentTimestamp <= endOfRange;
        // });

        setMarkers(prev => ({
          ...prev,
          incidents: incidentsArray // Update incidents in the markers state
        }));

        setTodayIncidents(filteredIncidents); // Store today's incidents
      } else {
        console.log("No incidents found in the database.");
        setMarkers(prev => ({
          ...prev,
          incidents: []
        }));
        setTodayIncidents([]); // Clear today's incidents
      }
    });

    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribePatrols();
      unsubscribeReports();
    };
  }, [db]);

  return (
    <MapDataContext.Provider
      value={{
        markers,
        todayIncidents, // Expose today's incidents
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
      }}
    >
      {children}
    </MapDataContext.Provider>
  );
};

// Custom hook to use the MapDataContext
export const useMapDataContext = () => useContext(MapDataContext);
