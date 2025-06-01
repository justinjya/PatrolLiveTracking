import { faChevronDown, faChevronUp, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import React, { useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./TatarManagement.css"; // Import the CSS file
import { shiftLabels, typeLabels } from "../../utils/OfficerLabels";

function TatarManagement() {
  const { markers, setSelectedCluster } = useMapDataContext();

  return (
    <div className="tatar-management">
      <h3 className="tatar-management-title">List of Tatars</h3>
      <div className="tatar-list">
        {markers.tatars.map(tatar => (
          <TatarCard key={tatar.id} tatar={tatar} setSelectedCluster={setSelectedCluster} />
        ))}
      </div>
    </div>
  );
}

function TatarCard({ tatar, setSelectedCluster }) {
  const map = useMap();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDropdown = () => {
    setIsExpanded(prev => !prev);
  };

  const viewOnMap = () => {
    // Calculate the center of the cluster_coordinates
    const center = tatar.cluster_coordinates.reduce(
      (acc, [lat, lng]) => {
        acc.lat += lat;
        acc.lng += lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    center.lat /= tatar.cluster_coordinates.length;
    center.lng /= tatar.cluster_coordinates.length;

    setSelectedCluster(tatar);
    map.setCenter(center); // Set the map center to the calculated center
    map.setZoom(17); // Zoom in to focus on the cluster
  };

  return (
    <div className="tatar-item">
      <div className="tatar-contents-container">
        <div className="tatar-contents">
          <div className="tatar-name">{tatar.name}</div>
          <div className="tatar-email">{tatar.email}</div>
          <div className="tatar-coordinates">
            <FontAwesomeIcon icon={faLocationDot} style={{ color: "#0B64C6" }} />
            &nbsp;&nbsp;&nbsp;
            {tatar.cluster_coordinates ? tatar.cluster_coordinates.length : 0} Titik Patroli
          </div>
        </div>
        <div>
          <button className="tatar-view-on-map-button" onClick={viewOnMap}>
            View on Map
          </button>
        </div>
      </div>
      {tatar.officers && Object.keys(tatar.officers).length > 0 && (
        <>
          <button className="dropdown-button" onClick={toggleDropdown}>
            {isExpanded
              ? `Hide Officers (${Object.keys(tatar.officers).length})`
              : `Show Officers (${Object.keys(tatar.officers).length})`}
            <span className="dropdown-icon">
              {isExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
            </span>
          </button>
          {isExpanded && (
            <div className="officer-list">
              {Object.values(tatar.officers).map(officer => (
                <OfficerCard key={officer.id} officer={officer} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OfficerCard({ officer }) {
  return (
    <div className="officer-card">
      <div className="officer-details">
        <div className="officer-name">{officer.name}</div>
        <div className="officer-badges">
          <div
            className="officer-badge"
            style={typeLabels[officer.type]?.style || {}} // Apply dynamic styles based on type
          >
            {typeLabels[officer.type]?.label || officer.type}
          </div>
          <div className="officer-badge shift-badge">{shiftLabels[officer.shift] || officer.shift}</div>
        </div>
      </div>
    </div>
  );
}

export default TatarManagement;
