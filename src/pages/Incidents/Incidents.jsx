import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faChevronDown, faChevronUp, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Incidents.css";

function Incidents() {
  const { markers, selectedIncident, setSelectedIncident } = useMapDataContext(); // Access selectedIncident from context
  const map = useMap();

  const handleViewClick = incident => {
    map.setCenter({ lat: incident.latitude, lng: incident.longitude }); // Move map center to incident location
    map.setZoom(17); // Zoom in a bit
    setSelectedIncident(incident); // Set the selected incident in context
  };

  // Sort incidents by timestamp in descending order
  const sortedIncidents = [...markers.incidents].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="incidents-page">
      <h3 className="incidents-title">Daftar Insiden</h3>
      <div className="incidents-list">
        {sortedIncidents.length === 0 ? (
          <div className="no-tasks-message">Tidak ada insiden yang tersedia</div>
        ) : (
          sortedIncidents.map(incident => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onViewClick={handleViewClick}
              isSelected={selectedIncident && selectedIncident.id === incident.id} // Check if the incident is selected
            />
          ))
        )}
      </div>
    </div>
  );
}

function IncidentCard({ incident, onViewClick, isSelected }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null); // Create a reference for the card

  const toggleDetails = () => {
    setIsExpanded(prev => !prev);
  };

  const photoUrls = incident.photoUrl ? incident.photoUrl.split(",") : [];

  // Automatically expand details if the incident is selected
  useEffect(() => {
    if (isSelected) {
      setIsExpanded(true); // Expand the card
    }
  }, [isSelected]);

  // Scroll to the expanded version after the state update
  useEffect(() => {
    if (isSelected && isExpanded) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); // Scroll to the expanded card
    }
  }, [isExpanded, isSelected]);

  return (
    <div ref={cardRef} className="incident-card">
      <div className="incident-content-container">
        <div className="incident-content">
          <div className="incident-title">{incident.title}</div>
          <div className="incident-timestamp">
            <FontAwesomeIcon icon={faClock} />
            &nbsp;&nbsp;&nbsp;
            {`${new Date(incident.timestamp).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })} ${new Date(incident.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            })}`}
          </div>
          <div className="incident-coordinates">
            <FontAwesomeIcon icon={faLocationDot} />
            &nbsp;&nbsp;&nbsp;
            {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
          </div>
        </div>
        <div>
          <button className="incident-view-on-map-button" onClick={() => onViewClick(incident)}>
            Lihat di Peta
          </button>
        </div>
      </div>
      <button className="dropdown-button" onClick={toggleDetails}>
        {isExpanded ? "Sembunyikan Detil" : "Detil Lebih Lanjut"}
        <span className="dropdown-icon">
          {isExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
        </span>
      </button>
      {isExpanded && (
        <div className="incident-extra-details">
          <div className="incident-description">
            <strong>Tugas Terkait</strong>
            <span>Tugas #{incident.taskId.slice(0, 8)}</span>
          </div>
          <div className="incident-photos">
            <strong>Foto</strong>
            {photoUrls.length > 0 ? (
              <div className="photo-gallery">
                {photoUrls.map((url, index) => (
                  <img key={index} src={url.trim()} alt={`Incident Photo ${index + 1}`} className="incident-photo" />
                ))}
              </div>
            ) : (
              <p>Tidak tersedia</p>
            )}
          </div>
          <div className="incident-description">
            <strong>Deskripsi</strong>
            <span>{incident.description || "Tidak tersedia"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Incidents;
