import { useMap } from "@vis.gl/react-google-maps";
import React, { useMemo, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Patrols.css";

function Patrols() {
  const { markers, setSelectedTask, clearPolylines, addPolylines } = useMapDataContext(); // Access global methods and state
  const map = useMap(); // Access the map instance
  const [collapsedClusters, setCollapsedClusters] = useState(() => {
    // Initialize all clusters as collapsed
    const initialState = {};
    markers.patrols.forEach(task => {
      const clusterName = task.clusterName || "Unknown Cluster";
      initialState[clusterName] = true; // Set collapsed state to true
    });
    return initialState;
  });

  const [collapsedStatuses, setCollapsedStatuses] = useState(() => {
    // Initialize all statuses within each cluster as collapsed
    const initialState = {};
    markers.patrols.forEach(task => {
      const clusterName = task.clusterName || "Unknown Cluster";
      const status = task.status || "Unknown Status";
      if (!initialState[clusterName]) {
        initialState[clusterName] = {};
      }
      initialState[clusterName][status] = true; // Set collapsed state to true
    });
    return initialState;
  });

  // Group patrols by clusterName and then by status
  const groupedByClusterAndStatus = useMemo(() => {
    const grouped = markers.patrols.reduce((acc, task) => {
      const clusterName = task.clusterName || "Unknown Cluster";
      const status = task.status || "Unknown Status";

      if (!acc[clusterName]) {
        acc[clusterName] = {};
      }
      if (!acc[clusterName][status]) {
        acc[clusterName][status] = [];
      }
      acc[clusterName][status].push(task);
      return acc;
    }, {});

    // Sort tasks within each status group by assignedStartTime
    Object.keys(grouped).forEach(clusterName => {
      Object.keys(grouped[clusterName]).forEach(status => {
        grouped[clusterName][status].sort((a, b) => new Date(a.assignedStartTime) - new Date(b.assignedStartTime));
      });
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

  const toggleClusterCollapse = clusterName => {
    setCollapsedClusters(prev => ({
      ...prev,
      [clusterName]: !prev[clusterName] // Toggle the collapsed state for the given cluster
    }));
  };

  const toggleStatusCollapse = (clusterName, status) => {
    setCollapsedStatuses(prev => ({
      ...prev,
      [clusterName]: {
        ...prev[clusterName],
        [status]: !prev[clusterName][status] // Toggle the collapsed state for the given status within the cluster
      }
    }));
  };

  const getOfficerDetails = (clusterId, officerId) => {
    const cluster = markers.tatars.find(tatar => tatar.id === clusterId);
    const officers = Array.isArray(cluster?.officers) ? cluster.officers : []; // Ensure officers is always an array
    const officer = officers.find(officer => officer.id === officerId);
    return officer
      ? {
          officerName: officer.name || "Unknown",
          officerType: officer.type || "Unknown",
          shift: officer.shift || "Unknown"
        }
      : {
          officerName: "Unknown",
          officerType: "Unknown",
          shift: "Unknown"
        };
  };

  return (
    <div className="patrols-page">
      <h3 className="patrols-title">List of Patrols</h3>
      <h3 className="patrols-title">History</h3>
      <div className="patrols-list">
        {Object.keys(groupedByClusterAndStatus).map(clusterName => (
          <div key={clusterName} className="patrol-card">
            <div className="patrol-card-header">
              <div className="patrol-cluster-name">{clusterName}</div>
            </div>
            <button className="toggle-button" onClick={() => toggleClusterCollapse(clusterName)}>
              {collapsedClusters[clusterName] ? "Show More ↓" : "Show Less ↑"}
            </button>
            {!collapsedClusters[clusterName] && (
              <div className="patrol-status-groups">
                {Object.keys(groupedByClusterAndStatus[clusterName]).map(status => (
                  <div key={status} className="patrol-status-group">
                    <div className="patrol-status-header">
                      <div className="patrol-status-name">{status}</div>
                      <button className="toggle-button" onClick={() => toggleStatusCollapse(clusterName, status)}>
                        {collapsedStatuses[clusterName][status] ? "Show More ↓" : "Show Less ↑"}
                      </button>
                    </div>
                    {!collapsedStatuses[clusterName][status] && (
                      <div className="patrol-items">
                        {groupedByClusterAndStatus[clusterName][status].map(task => {
                          const officerDetails = getOfficerDetails(task.clusterId, task.userId);
                          return (
                            <div key={task.id} className="patrol-item">
                              <div className="patrol-item-title">Tugas {task.id.slice(0, 8)}</div>
                              <span>{officerDetails.officerName}</span>
                              <div className="patrol-item-details">
                                <div className="patrol-item-badges">
                                  <div className="badge">{officerDetails.officerType}</div>
                                  <div className="badge">{officerDetails.shift}</div>
                                </div>
                                <div className="patrol-item-timestamps">
                                  <span>
                                    {new Date(task.assignedStartTime).toLocaleDateString()}, {new Date(task.assignedStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} - {new Date(task.assignedEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                                  </span>
                                </div>
                              </div>
                              <button className="view-map-button" onClick={() => handleViewClick(task)}>
                                View on Map
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

export default Patrols;