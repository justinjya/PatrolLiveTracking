import { useMap } from "@vis.gl/react-google-maps";
import React, { useMemo, useState } from "react";
import ImageWithSuspense from "../../components/ImageWithSuspense/ImageWithSuspense";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Incidents.css";

function Incidents() {
  const { markers, selectedIncident, setSelectedIncident } = useMapDataContext();
  const map = useMap();
  const [collapsedDates, setCollapsedDates] = useState({}); // State to track collapsed dates

  // Group incidents by date
  const groupedIncidents = useMemo(() => {
    const grouped = markers.incidents.reduce((acc, incident) => {
      const date = new Date(incident.timestamp).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(incident);
      return acc;
    }, {});

    // Sort the dates here
    const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    const sortedGrouped = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }, [markers.incidents]);

  const handleDetailClick = incident => {
    setSelectedIncident(incident); // Set the selected incident to display its details
  };

  const handleViewClick = incident => {
    map.setCenter({ lat: incident.latitude, lng: incident.longitude }); // Move map center to camera location
    map.setZoom(15); // Zoom in a bit
  };

  const toggleCollapse = date => {
    setCollapsedDates(prev => ({
      ...prev,
      [date]: !prev[date] // Toggle the collapsed state for the given date
    }));
  };

  const handleBackToList = () => {
    setSelectedIncident(null); // Clear the selected incident to go back to the list
  };

  // Render the Incident Detail Page
  if (selectedIncident) {
    return (
      <div key={selectedIncident.id} style={{ display: "flex", flexDirection: "column", textAlign: "start" }}>
        <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
          <button
            style={{ backgroundColor: "transparent", color: "black", padding: 0, border: "none" }}
            onClick={handleBackToList}
          >
            {"<"}
          </button>
          <h3 style={{ margin: 0 }}>{selectedIncident.title}</h3>
        </div>
        <h5 style={{ margin: 0 }}>{selectedIncident.timestamp}</h5>
        <p style={{ marginTop: 0, fontSize: "10px" }}>ID: {selectedIncident.id}</p>
        <div>
          {/* Display the incident photo with suspense */}
          {selectedIncident.photoUrl && (
            <ImageWithSuspense
              src={selectedIncident.photoUrl}
              alt="Incident"
            />
          )}
          <h5 style={{ marginBottom: 0 }}>Description</h5>
          <p style={{ margin: 0, fontSize: "12px" }}>{selectedIncident.description}</p>
        </div>
        <button
          className="view-map-button"
          style={{ fontSize: "12px", alignSelf: "flex-end" }}
          onClick={() => handleViewClick(selectedIncident)}
        >
          View on map
        </button>
      </div>
    );
  }

  // Render the Incident List Page
  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "auto", paddingBottom: "40px" }}>
      <h3 style={{ textAlign: "start", margin: 0 }}>List of Incidents</h3>
      <div style={{ textAlign: "left" }}>
        {Object.keys(groupedIncidents).map(date => (
          <div key={date}>
            <h4 style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleCollapse(date)}>
              {collapsedDates[date] ? "▶" : "▼"} Date: {date}
            </h4>
            {!collapsedDates[date] && (
              <div className="incidents-list">
                {groupedIncidents[date].map(incident => (
                  <div key={incident.id} className="incident-item">
                    <div
                      style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}
                    >
                      <p className="incident-item-id">{incident.id}</p>
                      <button className="incident-item-id view-map-button" onClick={() => handleViewClick(incident)}>
                        View on Map
                      </button>
                    </div>
                    <p className="incident-item-title">{incident.title}</p>
                    <div
                      style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}
                    >
                      <p className="incident-item-timestamp">{incident.timestamp}</p>
                      <button
                        className="incident-item-timestamp detail-button"
                        onClick={() => handleDetailClick(incident)}
                      >
                        {"Details >"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Incidents;
