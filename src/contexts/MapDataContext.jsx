import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { onValue, ref } from "firebase/database";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useFirebase } from "./FirebaseContext";

const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const { db } = useFirebase();
  const mapsLibrary = useMapsLibrary("maps");

  const dbMarkerRef = {
    users: "tatars",
    tasks: "patrols",
    reports: "incidents",
    cameras: "cameras"
  };
  const [markers, setMarkers] = useState({
    tatars: [],
    patrols: [],
    incidents: [],
    cameras: []
  });
  const [isEditing, setIsEditing] = useState(null);
  const [polyline, setPolyline] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Utility function to subscribe to data changes in Firebase
  const subscribeToFirebase = (firebaseRef, updateStateCallback, filterCallback = null, onComplete = null) => {
    return onValue(firebaseRef, snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dataArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        const filteredData = filterCallback ? dataArray.filter(filterCallback) : dataArray;

        updateStateCallback(prev => ({
          ...prev,
          [dbMarkerRef[firebaseRef.key]]: filteredData
        }));
      } else {
        updateStateCallback(prev => ({
          ...prev,
          [dbMarkerRef[firebaseRef.key]]: []
        }));
      }

      if (onComplete) {
        onComplete();
      }
    });
  };

  useEffect(() => {
    const patrolsRef = ref(db, "tasks");
    const reportsRef = ref(db, "reports");
    const tatarsRef = ref(db, "users");
    const camerasRef = ref(db, "cameras");

    let fetchCount = 0; // Track the number of completed fetches
    const totalFetches = 4; // Total number of Firebase subscriptions

    const handleFetchComplete = () => {
      fetchCount += 1;
      if (fetchCount === totalFetches) {
        setInitialized(true); // Set initialized to true after all fetches are complete
      }
    };

    const unsubscribePatrols = subscribeToFirebase(patrolsRef, setMarkers, null, handleFetchComplete);
    const unsubscribeReports = subscribeToFirebase(reportsRef, setMarkers, null, handleFetchComplete);
    const unsubscribeTatars = subscribeToFirebase(
      tatarsRef,
      setMarkers,
      tatar => tatar.role === "patrol",
      handleFetchComplete
    );
    const unsubscribeCameras = subscribeToFirebase(camerasRef, setMarkers, null, handleFetchComplete);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribePatrols();
      unsubscribeReports();
      unsubscribeTatars();
      unsubscribeCameras();
    };
  }, [db]);

  // Utility function to clear polylines
  const clearPolylines = () => {
    if (polyline) {
      polyline.setMap(null);
      setPolyline(null);
    }
    setSelectedTask(null);
  };

  // Utility function to add polylines
  const addPolylines = (map, routePath) => {
    if (!mapsLibrary || !routePath) return;

    const routePathPolyline = new mapsLibrary.Polyline({
      path: routePath.map(point => ({
        lat: point.coordinates[0],
        lng: point.coordinates[1]
      })),
      geodesic: true,
      strokeColor: "#0F64C6",
      strokeOpacity: 1.0,
      strokeWeight: 3
    });

    routePathPolyline.setMap(map);
    setPolyline(routePathPolyline);
  };

  return (
    <MapDataContext.Provider
      value={{
        markers,
        setMarkers,
        isEditing,
        setIsEditing,
        selectedTask,
        setSelectedTask,
        polyline,
        setPolyline,
        clearPolylines,
        addPolylines,
        mapsLibrary,
        selectedIncident,
        setSelectedIncident,
        selectedCluster,
        setSelectedCluster,
        selectedCamera,
        setSelectedCamera,
        initialized
      }}
    >
      {children}
    </MapDataContext.Provider>
  );
};

export const useMapDataContext = () => useContext(MapDataContext);
