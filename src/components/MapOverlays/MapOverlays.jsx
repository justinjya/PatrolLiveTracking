import { faTriangleExclamation, faUser, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AdvancedMarker, InfoWindow, Pin, useAdvancedMarkerRef, useMap } from "@vis.gl/react-google-maps";
import { ref, remove } from "firebase/database";
import React, { useEffect } from "react";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { useSidebarContext } from "../../contexts/SidebarContext";
import Incidents from "../../pages/Incidents/Incidents";
import Patrols from "../../pages/Patrols/Patrols";
import AddCameraMarkerInfoWindow from "../AddCameraMarkerInfoWindow/AddCameraMarkerInfoWindow";
import "./MapOverlays.css";
import { ref, remove } from "firebase/database";
import { useFirebase } from "../../contexts/FirebaseContext";

function MapOverlays({ infoWindow, closeInfoWindow, handleMarkerClick, displayOptions }) {
  const {
    markers,
    isEditing,
    selectedIncident,
    setSelectedIncident,
    selectedTask,
    setSelectedTask,
    selectedCluster,
    selectedCamera,
    tempPatrolPoints,
    setTempPatrolPoints,
    clearPolylines,
    addPolylines,
    checkIntersection
  } = useMapDataContext();
  const { db } = useFirebase(); // Import Firebase database from context
  const { handleMenuClick } = useSidebarContext(); // Import handleMenuClick from context
  const map = useMap();
  const [markerRef] = useAdvancedMarkerRef();

  const intersectedPoints = selectedTask?.route_path
    ? checkIntersection(selectedTask.assigned_route, selectedTask.route_path)
    : new Set();

  const handleDeleteCameraMarker = async () => {
    if (infoWindow && infoWindow.type === "marker") {
      const { marker } = infoWindow;

      try {
        const cameraRef = ref(db, `cameras/${marker.id}`); // Reference to the specific camera entry in Firebase
        await remove(cameraRef); // Remove the camera entry from Firebase
      } catch (error) {
        console.error("Error removing camera from Firebase:", error);
      }

      closeInfoWindow(); // Close the InfoWindow
    }
  };

  const handleAddPatrolPointMarker = () => {
    if (infoWindow && infoWindow.type === "map") {
      const newMarker = [infoWindow.lat, infoWindow.lng];
      setTempPatrolPoints([...tempPatrolPoints, newMarker]);
      closeInfoWindow(); // Close the InfoWindow
    }
  };

  const handleDeletePatrolPointMarker = index => {
    if (infoWindow && infoWindow.type === "marker") {
      setTempPatrolPoints(tempPatrolPoints.filter((_, i) => i !== index)); // Remove the marker at the specified index
      closeInfoWindow(); // Close the InfoWindow
    }
  };

  useEffect(() => {
    if (selectedTask && selectedTask.route_path) {
      const updatedTask = markers.patrols.find(task => task.id === selectedTask.id);
      clearPolylines();
      setSelectedTask(updatedTask);

      const routePath = updatedTask.route_path; // Object with coordinates (can be null)

      if (routePath) {
        const routePathCoordinates = Object.values(routePath);
        addPolylines(map, routePathCoordinates);
      }
    }
  }, [markers.patrols, selectedTask?.id]);

  useEffect(() => {
    if (selectedTask) {
      closeInfoWindow(); // Close InfoWindow when selectedTask.id changes
    }
  }, [selectedTask?.id]);

  return (
    <>
      {/* Render markers for cameras */}
      {markers.cameras.map(marker => {
        const isSelected = marker === selectedCamera; // Check if the marker is selected
        if (!displayOptions.cameras && !isSelected) return null; // Skip rendering if displayOptions is false and marker is not selected

        return (
          <AdvancedMarker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => handleMarkerClick({ marker })} // Handle marker clicks
          >
            <div className="camera-icon-container">
              <FontAwesomeIcon icon={faVideo} size="3x" className={`camera-icon ${isSelected ? "selected" : ""}`} />
              <FontAwesomeIcon icon={faVideo} className="camera-icon-border" />
              <div className="camera-icon-fill"></div>
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Render markers for incidents */}
      {markers.incidents.map(incident => {
        const isSelected = incident === selectedIncident; // Check if the incident is selected
        const isRelatedToSelectedTask = selectedTask && incident.taskId === selectedTask.id; // Check if the incident is related to the selected task

        // Render the marker if displayOptions.incidents is true, or if the incident is selected, or if it's related to the selected task
        if (!displayOptions.incidents && !isSelected && !isRelatedToSelectedTask) return null;

        return (
          <AdvancedMarker
            key={incident.id}
            position={{ lat: incident.latitude, lng: incident.longitude }}
            zIndex={999} // Set a high zIndex to ensure it renders above other markers
            onClick={() => {
              setSelectedIncident(incident);
              handleMenuClick("Insiden", <Incidents />); // Open the incidents menu
            }}
          >
            <div className="incident-icon-container">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                size="3x"
                className={`incident-icon ${isSelected ? "selected" : ""}`}
              />
              <FontAwesomeIcon icon={faTriangleExclamation} className="incident-icon-border" />
              <div className="incident-icon-fill"></div>
            </div>
          </AdvancedMarker>
        );
      })}

      {/* Render markers for assignedRoute */}
      {selectedTask?.assigned_route?.map(([lat, lng], index) => {
        const intersectedPoint = Array.from(intersectedPoints).find(point => point.lat === lat && point.lng === lng);

        const isIntersected = !!intersectedPoint;

        return (
          <AdvancedMarker
            ref={markerRef}
            key={`assignedRoute-${index}`}
            position={{ lat, lng }}
            onClick={() => {
              handleMarkerClick({
                marker: { lat, lng, timestamp: intersectedPoint ? intersectedPoint.timestamp : null }
              });
            }} // Handle marker clicks
          >
            <Pin
              background={isIntersected ? "#00EB1A" : "#FE2B25"} // Green for intersected, red for non-intersected
              glyphColor={isIntersected ? "#008100" : "#8D0004"}
              borderColor={"#FFFEFE"}
            />
          </AdvancedMarker>
        );
      })}

      {/* Render markers for mockDetections */}
      {selectedTask?.mock_detections &&
        Object.keys(selectedTask.mock_detections).map((key, index) => (
          <AdvancedMarker
            key={`mockLocation-${index}`}
            position={{
              lat: selectedTask.mock_detections[key].coordinates[0],
              lng: selectedTask.mock_detections[key].coordinates[1]
            }}
          >
            <Pin background="#9C2CF3" glyphColor={"#500A86"} borderColor={"#FFFEFE"} />
          </AdvancedMarker>
        ))}

      {/* Render patrol markers for ongoing tasks */}
      {markers.patrols
        .filter(patrol => patrol.status === "ongoing") // Filter patrols with status = "ongoing"
        .map(patrol => {
          // Get the last entry of the route_path object
          const lastRoutePoint = Object.entries(patrol.route_path || {}).pop();

          if (!lastRoutePoint) return null; // Skip if no route_path exists

          const [key, point] = lastRoutePoint; // Destructure the key and point

          const isSelected = selectedTask ? patrol.id === selectedTask.id : false; // Check if the marker is selected

          return (
            <AdvancedMarker
              key={`patrol-${patrol.id}-routePath-${key}`}
              position={{ lat: point.coordinates[0], lng: point.coordinates[1] }}
              onClick={() => {
                handleMenuClick("Patroli", <Patrols />); // Open the patrols menu
                setSelectedTask(patrol); // Set the selected task
              }}
            >
              <FontAwesomeIcon icon={faUser} size="3x" className={`patrol-icon ${isSelected ? "selected" : ""}`} />
              <FontAwesomeIcon icon={faUser} className="patrol-icon-border" />
            </AdvancedMarker>
          );
        })}

      {/* Render markers for when a cluster is selected */}
      {isEditing !== "Patrol Points" && tempPatrolPoints.length === 0 && selectedCluster?.cluster_coordinates?.map((coordinate, index) => (
        <AdvancedMarker
          key={`cluster-${selectedCluster.id}-coordinate-${index}`}
          position={{ lat: coordinate[0], lng: coordinate[1] }}
        >
          <Pin background="#FE2B25" glyphColor={"#8D0004"} borderColor={"#FFFEFE"} />
        </AdvancedMarker>
      ))}

      {/* Render markers for when editing cluster patrol points */}
      {tempPatrolPoints.map((marker, index) => (
        <AdvancedMarker
          key={`patrolPoint-${index}`}
          position={{ lat: marker[0], lng: marker[1] }}
          onClick={() => handleMarkerClick({ marker, index })} // Handle marker clicks
        >
          <Pin background="#FE2B25" glyphColor={"#8D0004"} borderColor={"#FFFEFE"} />
        </AdvancedMarker>
      ))}

      {/* InfoWindow for adding camera markers */}
      {infoWindow && infoWindow.type === "map" && isEditing === "Cameras" && (
        <InfoWindow position={{ lat: infoWindow.lat, lng: infoWindow.lng }} onCloseClick={closeInfoWindow}>
          <AddCameraMarkerInfoWindow
            position={{ lat: infoWindow.lat, lng: infoWindow.lng }}
            closeInfoWindow={closeInfoWindow}
          />
        </InfoWindow>
      )}

      {/* InfoWindow for marker clicks */}
      {infoWindow && infoWindow.type === "marker" && isEditing === "Cameras" && (
        <InfoWindow
          position={{
            lat: infoWindow.marker.lat,
            lng: infoWindow.marker.lng
          }}
          onCloseClick={closeInfoWindow} // Close the InfoWindow
        >
          <button onClick={handleDeleteCameraMarker}>Hapus Kamera</button>
        </InfoWindow>
      )}

      {/* InfoWindow for adding temporary patrol points markers */}
      {infoWindow && infoWindow.type === "map" && isEditing === "Patrol Points" && (
        <InfoWindow position={{ lat: infoWindow.lat, lng: infoWindow.lng }} onCloseClick={closeInfoWindow}>
          <button onClick={handleAddPatrolPointMarker}>Add Patrol Point Marker</button>
        </InfoWindow>
      )}

      {/* InfoWindow for temporary patrol points marker clicks */}
      {infoWindow && infoWindow.type === "marker" && isEditing === "Patrol Points" && (
        <InfoWindow
          position={{
            lat: infoWindow.marker[0],
            lng: infoWindow.marker[1]
          }}
          onCloseClick={closeInfoWindow} // Close the InfoWindow
        >
          <button onClick={() => handleDeletePatrolPointMarker(infoWindow.index)}>Remove Patrol Point Marker</button>
        </InfoWindow>
      )}

      {/* InfoWindow for selected marker */}
      {infoWindow && infoWindow.type === "marker" && selectedTask && (
        <InfoWindow
          position={{ lat: infoWindow.marker.lat, lng: infoWindow.marker.lng }}
          onCloseClick={closeInfoWindow}
        >
          <div>
            <strong>
              {infoWindow.marker.timestamp
                ? `Titik ini dikunjungi pada ${new Date(infoWindow.marker.timestamp).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}, ${new Date(infoWindow.marker.timestamp).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}`
                : "Titik ini belum dikunjungi."}
            </strong>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default MapOverlays;
