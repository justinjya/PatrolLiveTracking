import { faCheckSquare, faLayerGroup, faSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Map, useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import MapOverlays from "../MapOverlays/MapOverlays";
import "./InteractiveMap.css"; // Import the CSS file for styling

function InteractiveMap() {
  const defaultLocation = { lat: 22.54992, lng: 0 }; // Default location
  const zoom = 3; // Default zoom level

  const [infoWindow, setInfoWindow] = useState(null); // InfoWindow for map clicks or markers
  const [displayOptions, setDisplayOptions] = useState(() => {
    // Retrieve display options from local storage or use default values
    const savedOptions = localStorage.getItem("displayOptions");
    return savedOptions ? JSON.parse(savedOptions) : { cameras: true, incidents: true };
  });

  const { isEditing } = useMapDataContext(); // Access edit mode state from context
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

  useEffect(() => {
    setInfoWindow(null); // Reset InfoWindow when edit mode changes
  }, [isEditing]);

  useEffect(() => {
    // Save display options to local storage whenever they change
    localStorage.setItem("displayOptions", JSON.stringify(displayOptions));
  }, [displayOptions]);

  const handleMapClick = event => {
    if (!isEditing) {
      return; // If not in edit mode, do not open InfoWindow on map click
    }

    setInfoWindow({
      type: "map",
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng
    });
  };

  const handleMarkerClick = ({ marker, index = null }) => {
    if (!isEditing) {
      return; // If not in edit mode, do not open InfoWindow on marker click
    }

    setInfoWindow({
      type: "marker",
      marker,
      index
    });
  };

  const closeInfoWindow = () => {
    setInfoWindow(null); // Close the currently open InfoWindow
  };

  return (
    <div className="interactive-map-container">
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
          displayOptions={displayOptions} // Pass display options to control overlays
        />
      </Map>

      {/* Render expandable checklist */}
      <DisplayOptionsChecklist displayOptions={displayOptions} setDisplayOptions={setDisplayOptions} />
    </div>
  );
}

function DisplayOptionsChecklist({ displayOptions, setDisplayOptions }) {
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false); // State for checklist expansion

  const toggleChecklistOption = option => {
    setDisplayOptions(prev => ({
      ...prev,
      [option]: !prev[option] // Toggle the selected option
    }));
  };

  return (
    <div className="expandable-container">
      <div className="expandable-button" onClick={() => setIsChecklistExpanded(prev => !prev)}>
        <FontAwesomeIcon icon={isChecklistExpanded ? faXmark : faLayerGroup} className="expandable-icon" />
      </div>
      {isChecklistExpanded && (
        <div className="checklist">
          <h4 className="checklist-title">Opsi Tampilan</h4>
          <label>
            <FontAwesomeIcon
              icon={displayOptions.cameras ? faCheckSquare : faSquare}
              className="checkbox-icon"
              onClick={() => toggleChecklistOption("cameras")}
            />
            &nbsp;&nbsp; Kamera
          </label>
          <label>
            <FontAwesomeIcon
              icon={displayOptions.incidents ? faCheckSquare : faSquare}
              className="checkbox-icon"
              onClick={() => toggleChecklistOption("incidents")}
            />
            &nbsp;&nbsp; Insiden
          </label>
        </div>
      )}
    </div>
  );
}

export default InteractiveMap;
