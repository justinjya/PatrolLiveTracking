import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Incidents.css";

function Incidents() {
  const { markers, selectedIncident, setSelectedIncident } = useMapDataContext(); // Access selectedIncident from context
  const map = useMap();

  const handleViewClick = incident => {
    map.setCenter({ lat: incident.latitude, lng: incident.longitude }); // Move map center to incident location
    map.setZoom(15); // Zoom in a bit
  };

  return (
    <div className="incidents-page">
      <h3 className="incidents-title">List of Incidents</h3>
      <div className="incidents-list">
        {markers.incidents.map(incident => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onViewClick={handleViewClick}
            isSelected={selectedIncident && selectedIncident.id === incident.id} // Check if the incident is selected
          />
        ))}
      </div>
    </div>
  );
}

function IncidentCard({ incident, onViewClick, isSelected }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null); // Create a reference for the card

  const toggleDetails = () => {
    setIsExpanded(prev => !prev);
    setSelectedIncident(prev => (prev && prev.id === incident.id ? null : incident)); // Toggle selection state
  };

  const photoUrls = incident.photoUrl ? incident.photoUrl.split(",") : [];

  // Automatically expand details if the incident is selected
  useEffect(() => {
    if (isSelected) {
      setIsExpanded(true);
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); // Scroll to the selected card
    }
  }, [isSelected]);

  return (
    <div ref={cardRef} className="incident-card">
      <div className="incident-row">
        <div className="incident-title">{incident.title}</div>
        <div className="incident-coordinates">
          {incident.latitude}, {incident.longitude}
        </div>
      </div>
      <div className="incident-row">
        <div className="incident-timestamp">{new Date(incident.timestamp).toLocaleString()}</div>
        <button className="view-map-button" onClick={() => onViewClick(incident)}>
          View on Map
        </button>
      </div>
      <button className="dropdown-button" onClick={toggleDetails}>
        {isExpanded ? "Hide Details" : "Show Details"}
        <span className="dropdown-icon">{isExpanded ? "↑" : "↓"}</span>
      </button>
      {isExpanded && (
        <div className="incident-extra-details">
          <div className="incident-photos">
            <strong>Photos:</strong>
            {photoUrls.length > 0 ? (
              <div className="photo-gallery">
                {photoUrls.map((url, index) => (
                  <img key={index} src={url.trim()} alt={`Incident Photo ${index + 1}`} className="incident-photo" />
                ))}
              </div>
            ) : (
              <p>No photos available</p>
            )}
          </div>
          <div className="incident-description">
            <strong>Description:</strong> {incident.description || "No description available"}
          </div>
        </div>
      )}
    </div>
  );
}

export default Incidents;
