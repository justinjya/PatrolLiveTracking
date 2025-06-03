import { faTriangleExclamation, faUser, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AdvancedMarker, InfoWindow, Pin, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { useSidebarContext } from "../../contexts/SidebarContext";
import Incidents from "../../pages/Incidents/Incidents";
import Patrols from "../../pages/Patrols/Patrols";
import AddMarkerInfoWindow from "../AddMarkerInfoWindow/AddMarkerInfoWindow";
import "./MapOverlays.css";

function MapOverlays({ infoWindow, closeInfoWindow, handleMarkerClick }) {
  const {
    markers,
    isEditing,
    setMarkers,
    selectedIncident,
    setSelectedIncident,
    selectedTask,
    setSelectedTask,
    selectedCluster,
    selectedCamera,
    clearPolylines,
    addPolylines
  } = useMapDataContext();
  const { handleMenuClick } = useSidebarContext(); // Import handleMenuClick from context
  const map = useMap();

  const handleDeleteCameraMarker = () => {
    if (infoWindow && infoWindow.type === "marker") {
      const { marker } = infoWindow;
      setMarkers(prev => {
        const updatedCameras = prev.cameras.filter(m => m.id !== marker.id);

        if (updatedCameras.length === 0) {
          localStorage.removeItem("cameras");
        } else {
          localStorage.setItem("cameras", JSON.stringify(updatedCameras));
        }

        return {
          ...prev,
          cameras: updatedCameras
        };
      });
      closeInfoWindow(); // Close the InfoWindow
    }
  };

  const handleAddPatrolPointMarker = () => {
    if (infoWindow && infoWindow.type === "map") {
      const newMarker = [infoWindow.lat, infoWindow.lng];
      addMarker("tempPatrolPoints", newMarker);
      console.log(markers.tempPatrolPoints);
      closeInfoWindow(); // Close the InfoWindow
    }
  };

  const handleDeletePatrolPointMarker = index => {
    if (infoWindow && infoWindow.type === "marker") {
      console.log("Deleting patrol point marker at index:", index);
      setMarkers(prev => {
        const updatedTempPatrolPoints = prev.tempPatrolPoints.filter((_, i) => i !== index); // Remove the element at the index
        return {
          ...prev,
          tempPatrolPoints: updatedTempPatrolPoints
        };
      });
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
  }, [markers.patrols, selectedTask]);

  return (
    <>
      {/* Render markers for cameras */}
      {markers.cameras.map(marker => {
        const isSelected = marker === selectedCamera; // Check if the marker is selected
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

        return (
          <AdvancedMarker
            key={incident.id}
            position={{ lat: incident.latitude, lng: incident.longitude }}
            onClick={() => {
              setSelectedIncident(incident);
              handleMenuClick("Incidents", <Incidents />); // Open the incidents menu
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
      {selectedTask?.assigned_route?.map(([lat, lng], index) => (
        <AdvancedMarker key={`assignedRoute-${index}`} position={{ lat, lng }}>
          <Pin background="#FE2B25" glyphColor={"#8D0004"} borderColor={"#FFFEFE"} />
        </AdvancedMarker>
      ))}

      {/* Render markers for routePath */}
      {selectedTask?.status !== "ongoing" &&
        selectedTask?.route_path &&
        Object.values(selectedTask.route_path).map((point, index) => (
          <AdvancedMarker
            key={`routePath-${index}`}
            position={{ lat: point.coordinates[0], lng: point.coordinates[1] }}
          >
            <Pin background="#00EB1A" glyphColor={"#008100"} borderColor={"#FFFEFE"} />
          </AdvancedMarker>
        ))}

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

          return (
            <AdvancedMarker
              key={`patrol-${patrol.id}-routePath-${key}`}
              position={{ lat: point.coordinates[0], lng: point.coordinates[1] }}
              onClick={() => {
                handleMenuClick("Patrols", <Patrols />); // Open the patrols menu
                setSelectedTask(patrol); // Set the selected task
              }}
            >
              <FontAwesomeIcon icon={faUser} size="3x" className="patrol-icon" />
              <FontAwesomeIcon icon={faUser} className="patrol-icon-border" />
            </AdvancedMarker>
          );
        })}

      {/* Render markers for when a cluster is selected */}
      {selectedCluster?.cluster_coordinates?.map((coordinate, index) => (
        <AdvancedMarker
          key={`cluster-${selectedCluster.id}-coordinate-${index}`}
          position={{ lat: coordinate[0], lng: coordinate[1] }}
        >
          <Pin background="#FE2B25" glyphColor={"#8D0004"} borderColor={"#FFFEFE"} />
        </AdvancedMarker>
      ))}

      {/* Render markers for when editing cluster patrol points */}
      {markers.tempPatrolPoints.map((marker, index) => (
        <AdvancedMarker
          key={`tempPatrolPoint-${index}`}
          position={{ lat: marker[0], lng: marker[1] }}
          onClick={() => handleMarkerClick({ marker, index })} // Handle marker clicks
        >
          <Pin background="#FE2B25" glyphColor={"#8D0004"} borderColor={"#FFFEFE"} />
        </AdvancedMarker>
      ))}

      {/* InfoWindow for adding markers */}
      {infoWindow && infoWindow.type === "map" && (
        <AdvancedMarker position={{ lat: infoWindow.lat, lng: infoWindow.lng }} onCloseClick={closeInfoWindow}>
          <InfoWindow position={{ lat: infoWindow.lat, lng: infoWindow.lng }} onCloseClick={closeInfoWindow}>
            <AddMarkerInfoWindow
              position={{ lat: infoWindow.lat, lng: infoWindow.lng }}
              closeInfoWindow={closeInfoWindow}
            />
          </InfoWindow>
        </AdvancedMarker>
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
          <button onClick={handleDeleteCameraMarker}>Remove Camera</button>
        </InfoWindow>
      )}

      {/* InfoWindow for adding markers */}
      {infoWindow && infoWindow.type === "map" && isEditing === "Patrol Points" && (
        <InfoWindow position={{ lat: infoWindow.lat, lng: infoWindow.lng }} onCloseClick={closeInfoWindow}>
          <button onClick={handleAddPatrolPointMarker}>Add Patrol Point Marker</button>
        </InfoWindow>
      )}

      {/* InfoWindow for marker clicks */}
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
    </>
  );
}

export default MapOverlays;
