import { faCalendar } from "@fortawesome/free-regular-svg-icons";
import { faChevronDown, faChevronRight, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import React, { useMemo, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { shiftLabels, typeLabels } from "../../utils/OfficerLabels";
import "./Patrols.css";
import { timelinessLabels } from "../../utils/TimelinessLabels";

function Patrols() {
  const { markers, selectedTask, setSelectedTask, clearPolylines, addPolylines } = useMapDataContext(); // Access global methods and state
  const map = useMap(); // Access the map instance
  const coreLibrary = useMapsLibrary("core");
  const geometryLibrary = useMapsLibrary("geometry");
  const [collapsedClusters, setCollapsedClusters] = useState(() => {
    const initialState = {};
    markers.patrols.forEach(task => {
      const clusterName = task.clusterName || "Unknown Cluster";
      initialState[clusterName] = true;
    });
    return initialState;
  });
  const [collapsedStatuses, setCollapsedStatuses] = useState(() => {
    const initialState = {};
    markers.patrols.forEach(task => {
      const clusterName = task.clusterName || "Unknown Cluster";
      const status =
        task.status === "finished" ? task.timeliness || "Unknown Timeliness" : task.status || "Unknown Status";

      if (!initialState[clusterName]) {
        initialState[clusterName] = {};
      }
      initialState[clusterName][status] = true; // Initialize each status as collapsed
    });
    return initialState;
  });

  const groupedByClusterAndStatus = useMemo(() => {
    const grouped = markers.patrols.reduce((acc, task) => {
      const clusterName = task.clusterName || "Unknown Cluster";
      const status =
        task.status === "finished" ? task.timeliness || "Unknown Timeliness" : task.status || "Unknown Status";

      if (!acc[clusterName]) {
        acc[clusterName] = { statuses: {}, count: 0 }; // Initialize cluster with statuses and count
      }
      if (!acc[clusterName].statuses[status]) {
        acc[clusterName].statuses[status] = [];
      }
      acc[clusterName].statuses[status].push(task);
      acc[clusterName].count += 1; // Increment the count for the cluster
      return acc;
    }, {});

    Object.keys(grouped).forEach(clusterName => {
      const statuses = grouped[clusterName].statuses;

      // Sort tasks within each status by startTime
      Object.keys(statuses).forEach(status => {
        statuses[status].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      });

      // Sort statuses by timeliness order for finished tasks
      const sortedStatuses = Object.keys(statuses).sort((a, b) => {
        const timelinessOrder = { ontime: 1, late: 2, "Unknown Timeliness": 3 };
        return (timelinessOrder[a] || 99) - (timelinessOrder[b] || 99);
      });

      // Reorder statuses based on the sorted order
      grouped[clusterName].statuses = sortedStatuses.reduce((sorted, status) => {
        sorted[status] = statuses[status];
        return sorted;
      }, {});
    });

    return grouped;
  }, [markers.patrols]);

  const checkIntersection = (assignedRoute, routePath, radius = 5) => {
    if (!routePath) {
      return 0; // Return 0 intersections if routePath is null
    }

    let intersectionCount = 0; // Initialize intersection counter
    const visitedPoints = new Set(); // Track visited points in assignedRoute

    for (const [lat1, lng1] of assignedRoute) {
      const pointKey = `${lat1},${lng1}`; // Create a unique key for the point

      if (visitedPoints.has(pointKey)) {
        continue; // Skip if the point has already been visited
      }

      for (const {
        coordinates: [lat2, lng2]
      } of Object.values(routePath)) {
        const point1 = new coreLibrary.LatLng(lat1, lng1);
        const point2 = new coreLibrary.LatLng(lat2, lng2);

        const distance = geometryLibrary.spherical.computeDistanceBetween(point1, point2);
        if (distance <= radius) {
          intersectionCount++; // Increment counter for each intersection
          visitedPoints.add(pointKey); // Mark the point as visited
          break; // Stop checking further routePath points for this assignedRoute point
        }
      }
    }

    return intersectionCount; // Return the total count of intersections
  };

  const handleViewClick = task => {
    clearPolylines();

    const assignedRoute = task.assigned_route; // Array of [latitude, longitude]
    const routePath = task.route_path; // Object with coordinates (can be null)

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

    setSelectedTask(task);
    map.setCenter(center);
    map.setZoom(17);

    if (routePath) {
      const routePathCoordinates = Object.values(routePath);
      addPolylines(map, routePathCoordinates);
    }
  };

  const toggleClusterCollapse = clusterName => {
    setCollapsedClusters(prev => ({
      ...prev,
      [clusterName]: !prev[clusterName]
    }));
  };

  const toggleStatusCollapse = (clusterName, status) => {
    setCollapsedStatuses(prev => ({
      ...prev,
      [clusterName]: {
        ...prev[clusterName],
        [status]: !prev[clusterName][status]
      }
    }));
  };

  const showDetails = task => {
    setSelectedTask(task); // Set the selected task to show its details
  };

  const getOfficerDetails = (clusterId, officerId) => {
    const cluster = markers.tatars.find(tatar => tatar.id === clusterId);
    const officers = Array.isArray(cluster?.officers) ? cluster.officers : [];
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

  const statusLabels = {
    ontime: "On Time",
    late: "Late",
    expired: "Expired",
    active: "Active",
    idle: "Idle",
    "Unknown Timeliness": "Unknown Timeliness",
    "Unknown Status": "Unknown Status"
  };

  // if (selectedTask) {
  //   return (
  //     <PatrolDetails
  //       task={selectedTask}
  //       onBack={() => {
  //         setSelectedTask(null);
  //         clearPolylines(); // Clear polylines when going back to the list
  //       }}
  //       checkIntersection={checkIntersection} // Pass checkIntersection as a prop
  //       getOfficerDetails={getOfficerDetails} // Pass getOfficerDetails as a prop
  //     />
  //   );
  // }

  return (
    <div className="patrols-page">
      <h3 className="patrols-title">List of Patrols</h3>
      <h3 className="patrols-title">History</h3>
      <div className="patrols-list">
        {Object.keys(groupedByClusterAndStatus).map(clusterName => (
          <div key={clusterName} className="patrol-card">
            <div className="patrol-card-header">
              <div className="patrol-cluster-name">
                {clusterName}{" "}
                <span className="patrol-cluster-count">({groupedByClusterAndStatus[clusterName].count})</span>
              </div>
              <button className="toggle-button" onClick={() => toggleClusterCollapse(clusterName)}>
                {collapsedClusters[clusterName] ? (
                  <FontAwesomeIcon icon={faChevronDown} />
                ) : (
                  <FontAwesomeIcon icon={faChevronUp} />
                )}
              </button>
            </div>
            {!collapsedClusters[clusterName] && (
              <div className="patrol-status-groups">
                {Object.keys(groupedByClusterAndStatus[clusterName].statuses).map(status => (
                  <div key={status} className={`patrol-status-group ${status}`}>
                    <div className="patrol-status-header">
                      <div className="patrol-status-name">
                        {statusLabels[status] || status} (
                        {groupedByClusterAndStatus[clusterName].statuses[status].length})
                      </div>
                      <button className="toggle-button" onClick={() => toggleStatusCollapse(clusterName, status)}>
                        {collapsedStatuses[clusterName][status] ? (
                          <FontAwesomeIcon icon={faChevronDown} />
                        ) : (
                          <FontAwesomeIcon icon={faChevronUp} />
                        )}
                      </button>
                    </div>
                    {!collapsedStatuses[clusterName][status] && (
                      <div className="patrol-items">
                        {groupedByClusterAndStatus[clusterName].statuses[status].map(task => {
                          const officerDetails = getOfficerDetails(task.clusterId, task.userId);
                          const intersectionCount = checkIntersection(task.assigned_route, task.route_path);
                          const totalPoints = task.assigned_route.length;
                          const percentage = ((intersectionCount / totalPoints) * 100).toFixed(0);

                          return (
                            <div className="patrol-item" key={task.id}>
                              <div className="patrol-item-header">
                                <div className="patrol-item-title">Tugas #{task.id.slice(0, 8)}</div>
                                <div className="patrol-item-timeliness-badge" style={timelinessLabels[task.timeliness]?.style}>{timelinessLabels[task.timeliness]?.label || "Unknown Timeliness"}</div>
                              </div>
                              <span className="patrol-item-officer-name">{officerDetails.officerName}</span>
                              <div className="patrol-item-details">
                                <div className="patrol-item-badges">
                                  <div
                                    className="patrol-badge type-badge"
                                    style={typeLabels[officerDetails.officerType]?.style || {}}
                                  >
                                    {typeLabels[officerDetails.officerType]?.label || officerDetails.officerType}
                                  </div>
                                  <div className="patrol-badge shift-badge">{shiftLabels[officerDetails.shift]}</div>
                                </div>
                                <div className="patrol-item-timestamps">
                                  <span>
                                    <FontAwesomeIcon icon={faCalendar} />
                                    &nbsp;&nbsp;&nbsp;
                                    {isNaN(new Date(task.startTime).getTime())
                                      ? "N/A"
                                      : `${new Date(task.startTime).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "long",
                                          year: "numeric"
                                        })}, ${new Date(task.startTime).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false
                                        })}`}{" "}
                                    -{" "}
                                    {isNaN(new Date(task.endTime).getTime())
                                      ? "N/A"
                                      : new Date(task.endTime).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: false
                                        })}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                                    <div className="patrol-item-intersections">
                                      <div>Intersections</div>
                                      <div className="patrol-item-intersection-count">
                                        {intersectionCount} out of {totalPoints} points
                                      </div>
                                    </div>
                                    <div className="patrol-item-bar-chart">
                                      <div
                                        className="patrol-item-bar"
                                        style={{ width: `${percentage}%`, backgroundColor: "#007217" }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="patrol-badge percentage-badge">{percentage}%</div>
                                </div>
                              </div>
                              <div className="patrol-item-button-group">
                                <button className="patrol-item-view-on-map-button" onClick={() => handleViewClick(task)}>
                                  View on Map
                                </button>
                                <button className="patrol-item-details-button" onClick={() => showDetails(task)}>
                                  Details <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                              </div>
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

function PatrolDetails({ task, onBack, checkIntersection, getOfficerDetails }) {
  const officerDetails = getOfficerDetails(task.clusterId, task.userId);

  const intersectionCount = checkIntersection(task.assigned_route, task.route_path);
  const totalPoints = task.assigned_route.length;
  const percentage = ((intersectionCount / totalPoints) * 100).toFixed(2);

  const duration =
    task.startTime && task.endTime
      ? `${Math.floor((new Date(task.endTime) - new Date(task.startTime)) / (1000 * 60 * 60))} hours, ${Math.floor(
          ((new Date(task.endTime) - new Date(task.startTime)) % (1000 * 60 * 60)) / (1000 * 60)
        )} minutes`
      : "N/A";

  return (
    <div className="patrol-details-page">
      <h3 className="patrol-details-title">Patrol Details</h3>
      <div className="patrol-details">
        <div className="patrol-item-title">Tugas {task.id.slice(0, 8)}</div>
        <span>{officerDetails.officerName}</span>
        <div className="patrol-item-details">
          <div className="patrol-item-badges">
            <div className="badge">{officerDetails.officerType}</div>
            <div className="badge">{officerDetails.shift}</div>
          </div>
          <div className="patrol-item-status">
            <span>Status: {task.status || "Unknown"}</span>
          </div>
          <div className="patrol-item-timeliness">
            <span>Timeliness: {task.timeliness || "Unknown Timeliness"}</span>
          </div>
          <div className="patrol-item-timestamps">
            <span>
              {isNaN(new Date(task.startTime).getTime())
                ? "N/A"
                : `${new Date(task.startTime).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}, ${new Date(task.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  })}`}{" "}
              -{" "}
              {isNaN(new Date(task.endTime).getTime())
                ? "N/A"
                : new Date(task.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  })}
            </span>
          </div>
          <div className="patrol-item-duration">
            <span>Duration: {duration}</span>
          </div>
          <div className="patrol-item-distance">
            <span>Distance: {task.distance || "Unknown Distance"} km</span>
          </div>
          <div className="patrol-item-photo-reports">
            <span>Initial Photo Report:</span>
            {task.initialReportPhotoUrl ? (
              <div>
                <img src={task.initialReportPhotoUrl} alt="Initial Report" className="patrol-photo" />
                <span>
                  {isNaN(new Date(task.initialReportTime).getTime())
                    ? "N/A"
                    : `${new Date(task.initialReportTime).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}, ${new Date(task.initialReportTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      })}`}
                </span>
              </div>
            ) : (
              <span>N/A</span>
            )}
            <span>Final Photo Report:</span>
            {task.finalReportPhotoUrl ? (
              <div>
                <img src={task.finalReportPhotoUrl} alt="Final Report" className="patrol-photo" />
                <span>
                  {isNaN(new Date(task.finalReportTime).getTime())
                    ? "N/A"
                    : `${new Date(task.finalReportTime).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}, ${new Date(task.finalReportTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      })}`}
                </span>
              </div>
            ) : (
              <span>N/A</span>
            )}
          </div>
          <div className="patrol-item-intersections">
            <span>
              {intersectionCount} out of {totalPoints} points
            </span>
            <div className="patrol-item-bar-chart">
              <div className="patrol-item-bar" style={{ width: `${percentage}%`, backgroundColor: "#4caf50" }}></div>
            </div>
            <span>{percentage}% Completed</span>
          </div>
          <div className="patrol-item-fake-gps">
            <span>Fake GPS Detected: {task.mockLocationDetected ? "Yes" : "No"}</span>
            <span>Fake GPS Count: {task.mockLocationCount || 0}</span>
            {task.mock_detections && task.mock_detections.length > 0 && (
              <div className="patrol-item-mock-detections">
                <span>Mock Detections:</span>
                <ul>
                  {task.mock_detections.map((detection, index) => (
                    <li key={index}>
                      {detection.timestamp}: {detection.coordinates.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <button className="back-button" onClick={onBack}>
          Back to List
        </button>
      </div>
    </div>
  );
}

export default Patrols;
