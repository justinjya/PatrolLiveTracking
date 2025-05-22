import { AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import React from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";

function MapOverlays({ infoWindow, closeInfoWindow, handleMarkerClick }) {
  const { markers, isEditing, addMarker, setMarkers } = useMapDataContext();

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
        setMarkers((prev) => {
          const updatedCameras = prev.cameras.filter((m) => m.id !== marker.id);
          console.log("Updated cameras:", updatedCameras); // Debugging log
    
          if (updatedCameras.length === 0) {
            console.log("Removing cameras key from localStorage");
            localStorage.removeItem("cameras");
          } else {
            console.log("Updating cameras in localStorage:", updatedCameras);
            localStorage.setItem("cameras", JSON.stringify(updatedCameras));
          }
    
          return {
            ...prev,
            cameras: updatedCameras,
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
