import { useMap } from "@vis.gl/react-google-maps";
import React, { useMemo, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Incidents.css";

function Incidents() {
  const { markers } = useMapDataContext();
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

  const handleViewClick = incident => {
    map.setCenter({ lat: incident.latitude, lng: incident.longitude }); // Move map center to incident location
    map.setZoom(15); // Zoom in a bit
  };

  const toggleCollapse = date => {
    setCollapsedDates(prev => ({
      ...prev,
      [date]: !prev[date] // Toggle the collapsed state for the given date
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflow: "auto" }}>
      <h3>List of Incidents</h3>
      <div style={{ textAlign: "left" }}>
        {Object.keys(groupedIncidents).map(date => (
          <div key={date}>
            <h4 style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleCollapse(date)}>
              {collapsedDates[date] ? "▶" : "▼"} Date: {date}
            </h4>
            {!collapsedDates[date] && (
              <ul className="incidents-list">
                {groupedIncidents[date].map(incident => (
                  <li key={incident.id} className="incidents-item">
                    <pre>{JSON.stringify(incident, null, 2)}</pre> {/* Display raw JSON */}
                    <button className="view-button" onClick={() => handleViewClick(incident)}>
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Incidents;
