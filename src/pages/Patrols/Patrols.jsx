import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import React, { useEffect, useState } from "react";
import ExpandableMenu from "../../components/ExpandableMenu/ExpandableMenu";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Patrols.css";

function Patrols() {
  const { markers, setSelectedTask } = useMapDataContext(); // Access patrols and setSelectedTask from the context
  const map = useMap(); // Access the map instance
  const mapsLibrary = useMapsLibrary("maps"); // Access the Google Maps geometry library
  const [groupedPatrols, setGroupedPatrols] = useState({}); // State to store grouped patrols
  const [collapsedStatuses, setCollapsedStatuses] = useState({}); // State to track collapsed statuses
  const [polyline, setPolyline] = useState(); // State to store polylines

  // Group patrols by status and sort by createdAt
  useEffect(() => {
    const grouped = markers.patrols.reduce((acc, task) => {
      const status = task.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {});

    Object.keys(grouped).forEach(status => {
      grouped[status].sort((a, b) => new Date(a.assignedStartTime) - new Date(b.assignedStartTime));
    });

    setGroupedPatrols(grouped);
  }, [markers.patrols]);

  const handleViewClick = task => {
    // Clear the existing polyline if it exists
    if (polyline) {
      polyline.setMap(null); // Remove the existing polyline from the map
      setPolyline(null); // Reset the polyline state to null
    }

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

    // Draw polyline for route_path if it exists
    if (mapsLibrary && task.route_path) {
      const routePath = Object.values(task.route_path); // Extract route_path values
      const routePathPolyline = new mapsLibrary.Polyline({
        path: routePath.map(point => ({
          lat: point.coordinates[0],
          lng: point.coordinates[1]
        })), // Convert to Google Maps LatLng format
        geodesic: true,
        strokeColor: "#FF0000", // Red color for the polyline
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

      // Add the polyline to the map
      routePathPolyline.setMap(map);

      // Store the polyline in state
      setPolyline(routePathPolyline);

      // Log the polyline after it's added to the map
      console.log("Polyline added:", routePathPolyline);
    }
  };

  const toggleCollapse = status => {
    setCollapsedStatuses(prev => ({
      ...prev,
      [status]: !prev[status] // Toggle the collapsed state for the given status
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflow: "auto" }}>
      <h3>List of Patrols</h3>
      <div style={{ textAlign: "left" }}>
        {Object.keys(groupedPatrols).map(status => (
          <div key={status}>
            <h4 style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleCollapse(status)}>
              {collapsedStatuses[status] ? "▶" : "▼"} Status: {status}
            </h4>
            {!collapsedStatuses[status] && (
              <ul className="patrol-list">
                {groupedPatrols[status].map(task => (
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
