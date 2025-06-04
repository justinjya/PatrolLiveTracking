import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { onValue, ref } from "firebase/database";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useFirebase } from "./FirebaseContext";

const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const { db } = useFirebase();
  const mapsLibrary = useMapsLibrary("maps");
  const coreLibrary = useMapsLibrary("core");
  const geometryLibrary = useMapsLibrary("geometry");

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
  }, []);

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

  // Utility function to check intersections
  const checkIntersection = (assignedRoute, routePath, tolerance = 0.00015) => {
    if (!routePath || !mapsLibrary || !geometryLibrary || !coreLibrary) {
      return new Set(); // Return an empty set if routePath is null
    }

    const visitedPoints = new Set(); // Track visited points in assignedRoute

    // Convert routePath into a polyline
    const polylinePath = new mapsLibrary.Polyline({
      path: Object.values(routePath).map(({ coordinates }) => ({
        lat: coordinates[0],
        lng: coordinates[1]
      }))
    });

    for (const [lat1, lng1] of assignedRoute) {
      const pointKey = `${lat1},${lng1}`; // Create a unique key for the point

      if (visitedPoints.has(pointKey)) {
        continue; // Skip if the point has already been visited
      }

      const point = new coreLibrary.LatLng(lat1, lng1);

      // Check if the point is on or near the polyline
      const isOnEdge = geometryLibrary.poly.isLocationOnEdge(point, polylinePath, tolerance);

      if (isOnEdge) {
        // Find the closest routePath entry to the current point
        const closestRoutePathEntry = Object.values(routePath).reduce((closest, current) => {
          const currentDistance = geometryLibrary.spherical.computeDistanceBetween(
            point,
            new coreLibrary.LatLng(current.coordinates[0], current.coordinates[1])
          );

          if (currentDistance < (closest?.distance || Infinity)) {
            return {
              entry: current,
              distance: currentDistance
            };
          }

          return closest;
        }, null);

        // Add the point and its timestamp to the visitedPoints set
        if (closestRoutePathEntry && closestRoutePathEntry.distance <= tolerance * 111000) {
          // Convert tolerance from degrees to meters (approx. 111,000 meters per degree)
          visitedPoints.add({
            lat: lat1,
            lng: lng1,
            timestamp: closestRoutePathEntry.entry.timestamp // Use the timestamp of the closest point
          });
        } else {
          visitedPoints.add({ lat: lat1, lng: lng1, timestamp: null }); // Add without timestamp if no close match
        }
      }
    }

    return visitedPoints; // Return the set of visited points with timestamps
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
        initialized,
        checkIntersection
      }}
    >
      {children}
    </MapDataContext.Provider>
  );
};

export const useMapDataContext = () => useContext(MapDataContext);
