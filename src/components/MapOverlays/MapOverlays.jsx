import { AdvancedMarker, InfoWindow, Pin } from "@vis.gl/react-google-maps";
import React from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { useSidebarContext } from "../../contexts/SidebarContext";
import Incidents from "../../pages/Incidents/Incidents";

function MapOverlays({ infoWindow, closeInfoWindow, handleMarkerClick }) {
  const { markers, todayIncidents, setSelectedIncident, isEditing, addMarker, setMarkers, selectedTask } = useMapDataContext();
  const { handleMenuClick } = useSidebarContext(); // Import handleMenuClick from context

  const handleAddMarker = () => {
    if (infoWindow && infoWindow.type === "map") {
      const newMarker = {
        id: Date.now(),
        lat: infoWindow.lat,
        lng: infoWindow.lng
      };
      addMarker("cameras", newMarker); // Add the marker to the "cameras" type
      closeInfoWindow(); // Close the InfoWindow
    }
  };

  const handleDeleteMarker = () => {
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

  return (
    <>
      {/* Render camera markers */}
      {markers.cameras.map(marker => (
        <AdvancedMarker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          onClick={() => handleMarkerClick(marker)} // Handle marker clicks
        >
          <span style={{ fontSize: "30px" }}>📷</span>
        </AdvancedMarker>
      ))}

      {/* Render today's incidents */}
      {todayIncidents.map(incident => (
        <AdvancedMarker key={incident.id} position={{ lat: incident.latitude, lng: incident.longitude }} onClick={() => {
          handleMenuClick("Incidents", <Incidents />); // Open the incidents menu
          setSelectedIncident(incident)
        }}>
          <span style={{ fontSize: "30px" }}>⚠️</span>
        </AdvancedMarker>
      ))}

      {/* Render markers for assignedRoute */}
      {selectedTask?.assigned_route?.map(([lat, lng], index) => (
        <AdvancedMarker key={`assignedRoute-${index}`} position={{ lat, lng }}>
          <Pin
            background="blue" // Blue for assignedRoute
            glyphColor={"#000"}
            borderColor={"#000"}
          />
        </AdvancedMarker>
      ))}

      {/* Render markers for routePath */}
      {selectedTask?.route_path &&
        Object.values(selectedTask.route_path).map((point, index) => (
          <AdvancedMarker
            key={`routePath-${index}`}
            position={{ lat: point.coordinates[0], lng: point.coordinates[1] }}
          >
            <Pin
              background="red" // Red for routePath
              glyphColor={"#000"}
              borderColor={"#000"}
            />
          </AdvancedMarker>
        ))}

      {/* InfoWindow for map clicks */}
      {infoWindow && infoWindow.type === "map" && isEditing && (
        <InfoWindow
          position={{ lat: infoWindow.lat, lng: infoWindow.lng }}
          onCloseClick={closeInfoWindow} // Close the InfoWindow
        >
          <button onClick={handleAddMarker}>Add Marker</button>
        </InfoWindow>
      )}

      {/* InfoWindow for marker clicks */}
      {infoWindow && infoWindow.type === "marker" && (
        <InfoWindow
          position={{
            lat: infoWindow.marker.lat,
            lng: infoWindow.marker.lng
          }}
          onCloseClick={closeInfoWindow} // Close the InfoWindow
        >
          {isEditing ? (
            <button onClick={handleDeleteMarker}>Delete Marker</button>
          ) : (
            <p>Marker Information</p> // Placeholder for non-editing mode content
          )}
        </InfoWindow>
      )}
    </>
  );
}

export default MapOverlays;
