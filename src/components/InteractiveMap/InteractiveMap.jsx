import { Map, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useState } from "react";
import MapOverlays from "../MapOverlays/MapOverlays";

function InteractiveMap() {
  const defaultLocation = { lat: 22.54992, lng: 0 }; // Default location
  const zoom = 3; // Default zoom level

  // Centralized state for the currently open InfoWindow
  const [infoWindow, setInfoWindow] = useState(null); // InfoWindow for map clicks or markers

  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          map.setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }); // Update map center to user's location
          map.setZoom(15); // Update zoom level when location is fetched
        },
        error => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [map]);

  const handleMapClick = event => {
    // Open an InfoWindow at the clicked location and close any other InfoWindow
    setInfoWindow({
      type: "map", // Indicates this InfoWindow is for a map click
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng
    });
  };

  const handleMarkerClick = marker => {
    // Open an InfoWindow for the clicked marker and close any other InfoWindow
    setInfoWindow({
      type: "marker", // Indicates this InfoWindow is for a marker
      marker
    });
  };

  const closeInfoWindow = () => {
    // Close the currently open InfoWindow
    setInfoWindow(null);
  };

  return (
    <Map
      mapId="interactive-map"
      style={{ width: "100vw", height: "100vh" }}
      defaultCenter={defaultLocation}
      defaultZoom={zoom}
      gestureHandling={"greedy"}
      disableDefaultUI={true}
      onClick={handleMapClick} // Handle map clicks
    >
      {/* Render overlays (markers and info windows) */}
      <MapOverlays
        infoWindow={infoWindow}
        setInfoWindow={setInfoWindow}
        closeInfoWindow={closeInfoWindow}
        handleMarkerClick={handleMarkerClick}
      />
    </Map>
  );
}

export default InteractiveMap;
