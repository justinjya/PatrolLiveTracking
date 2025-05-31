import React, { useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./TatarManagement.css"; // Import the CSS file

function TatarManagement() {
  const { markers } = useMapDataContext();

  return (
    <div className="tatar-management">
      <h3 className="tatar-management-title">List of Tatars</h3>
      <div className="tatar-list">
        {markers.tatars.map(tatar => (
          <TatarCard key={tatar.id} tatar={tatar} />
        ))}
      </div>
    </div>
  );
}

function TatarCard({ tatar }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDropdown = () => {
    setIsExpanded(prev => !prev);
  };

  const viewOnMap = () => {
    console.log(`Viewing tatar on map with ID: ${tatar.id}`);
  };

  const shiftLabels = {
    pagi: "Pagi",
    siang: "Siang",
    sore: "Sore",
    malam: "Malam",
  };

  const typeLabels = {
    outsource: "Outsource",
    organik: "Organik",
  };

  return (
    <div className="tatar-item">
      <div>
        <div className="tatar-name">{tatar.name}</div>
        <div className="tatar-email">{tatar.email}</div>
      </div>
      <div className="tatar-coordinates">
        <span className="badge badge-green">
          Jumlah Titik: {tatar.cluster_coordinates ? tatar.cluster_coordinates.length : 0}
        </span>
        <button className="action-button view-button" onClick={viewOnMap}>
          View on Map
        </button>
      </div>
      {tatar.officers && Object.keys(tatar.officers).length > 0 && (
        <>
          <button className="dropdown-button" onClick={toggleDropdown}>
            {isExpanded
              ? `Hide Officers (${Object.keys(tatar.officers).length})`
              : `Show Officers (${Object.keys(tatar.officers).length})`}
            <span className="dropdown-icon">{isExpanded ? "↑" : "↓"}</span>
          </button>
          {isExpanded && (
            <div className="officer-list">
              {Object.values(tatar.officers).map(officer => (
                <OfficerCard
                  key={officer.id}
                  officer={officer}
                  shiftLabels={shiftLabels}
                  typeLabels={typeLabels}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OfficerCard({ officer, shiftLabels, typeLabels }) {
  return (
    <div className="officer-card">
      <div className="officer-details">
        <div className="officer-name">{officer.name}</div>
        <div className="officer-badges">
          <span className="badge badge-yellow">
            {shiftLabels[officer.shift] || officer.shift}
          </span>
          <span className="badge badge-blue">
            {typeLabels[officer.type] || officer.type.charAt(0).toUpperCase() + officer.type.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TatarManagement;