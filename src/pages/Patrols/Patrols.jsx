import { useMap } from "@vis.gl/react-google-maps";
import React, { useMemo, useState, useEffect } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Patrols.css";

function Patrols() {
  const { markers, setSelectedTask, selectedTask, clearPolylines, addPolylines } = useMapDataContext(); // Access global methods and state
  const map = useMap(); // Access the map instance
  const [collapsedStatuses, setCollapsedStatuses] = useState({}); // State to track collapsed statuses

  // Define the custom order for statuses
  const statusOrder = ["ongoing", "active", "finished", "expired", "cancelled"];

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

    // Sort the grouped statuses based on the custom order
    const sortedGrouped = {};
    Object.keys(grouped)
      .sort((a, b) => statusOrder.indexOf(a) - statusOrder.indexOf(b))
      .forEach((status) => {
        sortedGrouped[status] = grouped[status];
      });

    return sortedGrouped;
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

  // Automatically update the polyline for the currently viewed task if it has the status of "ongoing"
  useEffect(() => {
    if (selectedTask && selectedTask?.status === "ongoing" && selectedTask.route_path) {
      const updatedTask = markers.patrols.find((task) => task.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask); // Update the selected task with the latest state
      }

      clearPolylines(); // Clear existing polylines
      const routePath = Object.values(selectedTask.route_path); // Extract route_path values
      addPolylines(map, routePath); // Add polyline for the selected task
    }
  }, [markers.patrols]);

  const handleBackToList = () => {
    setSelectedTask(null); // Clear the selected task to go back to the list
    clearPolylines(); // Clear any existing polylines
  };

  const handleViewOnMap = (coordinates) => {
    map.panTo({ lat: coordinates[0], lng: coordinates[1] }); // Pan the map to the specified coordinates
    map.setZoom(17); // Optionally zoom in
  };

  // Render the Patrol Details Page
  if (selectedTask) {
    return (
      <div
        key={selectedTask.id}
        style={{
          display: "flex",
          flexDirection: "column",
          textAlign: "start",
          height: "100%",
          overflow: "hidden",
          paddingBottom: "40px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
          <button
            style={{ backgroundColor: "transparent", color: "black", padding: 0, border: "none" }}
            onClick={handleBackToList}
          >
            {"<"}
          </button>
          <h3 style={{ margin: 0 }}>Patrol Details</h3>
        </div>
        <div style={{ overflowY: "auto", flex: 1, paddingRight: "10px" }}>
          <h5 style={{ margin: 0 }}>ID: {selectedTask.id}</h5>
          <p style={{ marginTop: 0, fontSize: "12px" }}>Status: {selectedTask.status}</p>
          <div>
            <h5>Assigned Times</h5>
            <p>Start: {selectedTask.assignedStartTime}</p>
            <p>End: {selectedTask.assignedEndTime}</p>
          </div>
          <div>
            <h5>Cluster</h5>
            <p>Name: {selectedTask.clusterName}</p>
          </div>
          <div>
            <h5>Distance</h5>
            <p>{selectedTask.distance} meters</p>
          </div>
          <div>
            <h5>Activity</h5>
            <p>Route Path:</p>
            <ul>
              {Object.entries(selectedTask.route_path || {}).map(([key, point]) => (
                <li key={key}>
                  Coordinates: {point.coordinates.join(", ")} | Timestamp: {point.timestamp}
                  <button
                    style={{
                      marginLeft: "10px",
                      padding: "5px 10px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleViewOnMap(point.coordinates)}
                  >
                    View on Map
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5>Officer</h5>
            <p>Name: {selectedTask.officerName}</p>
          </div>
          <div>
            <h5>Timeliness</h5>
            <p>{selectedTask.timeliness}</p>
          </div>
          <div>
            <h5>Start and End Times</h5>
            <p>Start: {selectedTask.startTime}</p>
            <p>End: {selectedTask.endTime}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render the Patrol List Page
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "40px", overflow: "hidden" }}>
      <h3 style={{ textAlign: "start", margin: 0 }}>List of Patrols</h3>
      <div style={{ textAlign: "left", overflowY: "auto", flex: 1 }}>
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