import { useMap } from "@vis.gl/react-google-maps";
import React, { useMemo, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Patrols.css";

function Patrols() {
  const { markers, setSelectedTask, clearPolylines, addPolylines } = useMapDataContext(); // Access global methods and state
  const map = useMap(); // Access the map instance
  const [collapsedStatuses, setCollapsedStatuses] = useState({}); // State to track collapsed statuses

  // Group patrols by status and sort by assignedStartTime
  const groupedPatrols = useMemo(() => {
    const grouped = markers.patrols.reduce((acc, task) => {
      const status = task.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {});

    Object.keys(grouped).forEach((status) => {
      grouped[status].sort((a, b) => new Date(a.assignedStartTime) - new Date(b.assignedStartTime));
    });

    return grouped;
  }, [markers.patrols]);

  const handleViewClick = (task) => {
    clearPolylines(); // Use the global clearPolylines method

    // Calculate the center of the assignedRoute
    const assignedRoute = task.assigned_route;
    const center = assignedRoute.reduce(
      (acc, [lat, lng]) => {
        acc.lat += lat;
        acc.lng += lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    center.lat /= assignedRoute.length;
    center.lng /= assignedRoute.length;

    setSelectedTask(task); // Set the selected task in the context
    map.setCenter(center); // Move map center to the calculated center of assignedRoute
    map.setZoom(17); // Zoom in a bit

    // Add polyline for route_path if it exists
    if (task.route_path) {
      const routePath = Object.values(task.route_path); // Extract route_path values
      addPolylines(map, routePath); // Use the global addPolylines method
    }
  };

  const toggleCollapse = (status) => {
    setCollapsedStatuses((prev) => ({
      ...prev,
      [status]: !prev[status], // Toggle the collapsed state for the given status
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflow: "auto" }}>
      <h3>List of Patrols</h3>
      <div style={{ textAlign: "left" }}>
        {Object.keys(groupedPatrols).map((status) => (
          <div key={status}>
            <h4 style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleCollapse(status)}>
              {collapsedStatuses[status] ? "▶" : "▼"} Status: {status}
            </h4>
            {!collapsedStatuses[status] && (
              <ul className="patrol-list">
                {groupedPatrols[status].map((task) => (
                  <li key={task.id} className="patrol-item">
                    <pre>{JSON.stringify(task, null, 2)}</pre> {/* Display raw JSON */}
                    <button className="view-button" onClick={() => handleViewClick(task)}>
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

export default Patrols;