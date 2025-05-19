import { useMap } from "@vis.gl/react-google-maps";
import React, { createContext, useEffect, useState } from "react";

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState({ lat: 22.54992, lng: 0 }); // Default location
  const [zoom, setZoom] = useState(3); // Default zoom level
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

  return (
    <LocationContext.Provider value={{ currentLocation, setCurrentLocation, zoom, setZoom }}>
      {children}
    </LocationContext.Provider>
  );
};
