import { faCalendar, faClock } from "@fortawesome/free-regular-svg-icons";
import { faChevronDown, faChevronUp, faLocationDot, faRoute, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { shiftOptions, typeOptions } from "../../utils/OfficerOptions";
import { timelinessLabels } from "../../utils/TimelinessLabels";
import "./Patrols.css";

function Patrols() {
  const { markers, selectedTask, setSelectedTask } = useMapDataContext(); // Access global methods and state
  const map = useMap(); // Access the map instance
  const coreLibrary = useMapsLibrary("core");
  const geometryLibrary = useMapsLibrary("geometry");
  const itemRefs = useRef({});

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
      if (task.status === "ongoing") {
        return acc; // Skip tasks with "ongoing" status
      }

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
    if (!routePath || !geometryLibrary || !coreLibrary) {
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

  const getOfficerDetails = (clusterId, officerId) => {
    // Find the cluster by ID
    const cluster = markers.tatars.find(tatar => tatar.id === clusterId);

    // Normalize officers into an array using Object.values
    const officers = Array.isArray(cluster?.officers)
      ? cluster.officers // Use directly if it's already an array
      : cluster?.officers
      ? Object.values(cluster.officers) // Convert object to array
      : []; // Default to an empty array if no officers exist

    // Find the officer by ID
    const officer = officers.find(officer => officer.id === officerId);

    // Return officer details or default values
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

  const handleViewClick = task => {
    const assignedRoute = task.assigned_route; // Array of [latitude, longitude]
    const routePath = task.route_path; // Object with coordinates (can be null)

    let center;

    if (task.status === "ongoing" && routePath) {
      // Center to the last index in route_path for ongoing tasks
      const lastPoint = Object.values(routePath).slice(-1)[0];
      center = { lat: lastPoint.coordinates[0], lng: lastPoint.coordinates[1] };
    } else {
      // Calculate the center for non-ongoing tasks
      center = assignedRoute.reduce(
        (acc, [lat, lng]) => {
          acc.lat += lat;
          acc.lng += lng;
          return acc;
        },
        { lat: 0, lng: 0 }
      );

      center.lat /= assignedRoute.length;
      center.lng /= assignedRoute.length;
    }

    setSelectedTask(task);
    map.setCenter(center);
    map.setZoom(17);
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

  const statusLabels = {
    ontime: "Tepat Waktu",
    late: "Terlambat",
    expired: "Kadaluarsa",
    active: "Aktif",
    idle: "Tidak Aktif",
    "Unknown Timeliness": "Tidak Diketahui",
    "Unknown Status": "Tidak Diketahui"
  };

  useEffect(() => {
    if (selectedTask && itemRefs.current[selectedTask.id]) {
      itemRefs.current[selectedTask.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedTask]);

  return (
    <div className="patrols-page">
      <h3 className="patrols-title">Daftar Patroli</h3>
      <div className="patrols-list">
        <h4 className="patrols-subtitle">Sedang Berjalan</h4>
        {markers.patrols.filter(task => task.status === "ongoing").length === 0 ? (
          <div className="no-tasks-message">Tidak ada patroli yang sedang berjalan</div>
        ) : (
          markers.patrols
            .filter(task => task.status === "ongoing")
            .map(task => (
              <PatrolItem
                key={task.id}
                ref={el => (itemRefs.current[task.id] = el)}
                task={task}
                map={map}
                getOfficerDetails={getOfficerDetails}
                checkIntersection={checkIntersection}
                onViewClick={() => handleViewClick(task)}
              />
            ))
        )}
        <h4 className="patrols-subtitle">Riwayat</h4>
        {markers.patrols.length === 0 ? (
          <div className="no-tasks-message">Tidak ada riwayat patroli yang tersedia</div>
        ) : (
          Object.keys(groupedByClusterAndStatus).map(clusterName => (
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
                          {groupedByClusterAndStatus[clusterName].statuses[status].map(task => (
                            <PatrolItem
                              key={task.id}
                              task={task}
                              map={map}
                              setSelectedTask={setSelectedTask}
                              getOfficerDetails={getOfficerDetails}
                              checkIntersection={checkIntersection}
                              onViewClick={() => handleViewClick(task)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PatrolItem({ ref, task, map, getOfficerDetails, checkIntersection, onViewClick }) {
  const { markers, setSelectedTask, setSelectedIncident } = useMapDataContext(); // Access global methods and state

  const officerDetails = getOfficerDetails(task.clusterId, task.userId);
  const intersectionCount = checkIntersection(task.assigned_route, task.route_path);
  const totalPoints = task.assigned_route.length;
  const percentage = ((intersectionCount / totalPoints) * 100).toFixed(0);

  const [isExpanded, setIsExpanded] = useState(false); // Track whether details are expanded

  const duration =
    task.startTime && task.endTime
      ? `${Math.floor((new Date(task.endTime) - new Date(task.startTime)) / (1000 * 60 * 60))}h ${Math.floor(
          ((new Date(task.endTime) - new Date(task.startTime)) % (1000 * 60 * 60)) / (1000 * 60)
        )}m ${Math.floor(((new Date(task.endTime) - new Date(task.startTime)) % (1000 * 60)) / 1000)}s`
      : "Tidak Tersedia";

  const handleMockLocationClick = (task, mockDetection) => {
    setSelectedTask(task); // Set the selected task to the clicked mock detection
    const center = {
      lat: mockDetection.coordinates[0],
      lng: mockDetection.coordinates[1]
    };

    map.setCenter(center); // Center the map on the first mock location
    map.setZoom(17); // Zoom in to focus on the mock location
  };

  const handleIncidentViewClick = incident => {
    const center = {
      lat: incident.latitude,
      lng: incident.longitude
    };
    map.setCenter(center); // Center the map on the incident location
    map.setZoom(17); // Zoom in to focus on the incident
    setSelectedIncident(incident); // Set the selected incident in context
  };

  // Find the type label and style from typeOptions
  const typeOption = typeOptions.find(option => option.value === officerDetails.officerType);
  const typeLabel = typeOption?.label || officerDetails.officerType;
  const typeStyle = typeOption?.style || {};

  // Find the shift label from shiftOptions
  const shiftOption = shiftOptions.find(option => option.value === officerDetails.shift);
  const shiftLabel = shiftOption?.label || officerDetails.shift;

  // Filter incidents that match the current taskId
  const relatedIncidents = markers.incidents.filter(incident => incident.taskId === task.id);

  return (
    <div ref={ref} className={`patrol-item ${task.status === "ongoing" ? "ongoing" : ""}`} key={task.id}>
      <div className="patrol-item-header">
        {task.status === "ongoing" && <div className="patrol-item-title">{task.clusterName}</div>}
        <div className={`patrol-item-${task.status === "ongoing" ? "sub" : ""}title`}>Tugas #{task.id.slice(0, 8)}</div>
        <div className="patrol-item-header-badge-group">
          <div className="patrol-item-timeliness-badge" style={timelinessLabels[task.timeliness]?.style}>
            {timelinessLabels[task.timeliness]?.label || "Tidak Diketahui"}
          </div>
          {relatedIncidents.length > 0 && (
            <div className="patrol-item-incident-badge">{relatedIncidents.length} Insiden</div>
          )}
          {task.mockLocationDetected && <div className="patrol-item-fake-gps-indicator-badge">Fake GPS Terdeteksi</div>}
        </div>
      </div>
      <div className="patrol-item-officer-group">
        <FontAwesomeIcon icon={faUserShield} size="2x" />
        <div>
          <strong className="patrol-item-officer-name">{officerDetails.officerName}</strong>
          <div className="patrol-item-badges">
            <div className="patrol-badge type-badge" style={typeStyle}>
              {typeLabel}
            </div>
            <div className="patrol-badge shift-badge">{shiftLabel}</div>
          </div>
        </div>
      </div>
      <div className="patrol-item-details">
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
        <div className="patrol-item-intersections-container">
          <div className="patrol-item-intersections-bar-container">
            <div className="patrol-item-intersections">
              <div>Titik Dikunjungi</div>
              <div className="patrol-item-intersection-count">
                {intersectionCount} dari {totalPoints} titik
              </div>
            </div>
            <div className="patrol-item-bar-chart">
              <div className="patrol-item-bar" style={{ width: `${percentage}%`, backgroundColor: "#007217" }}></div>
            </div>
          </div>
          <div className="patrol-badge percentage-badge">{percentage}%</div>
        </div>
      </div>
      <div className="patrol-item-view-on-map-button-container">
        <button className="patrol-item-view-on-map-button" onClick={onViewClick}>
          Lihat di Peta
        </button>
      </div>
      <div className="patrol-item-details-button-container">
        <button className="patrol-item-details-button" onClick={() => setIsExpanded(prev => !prev)}>
          {isExpanded ? "Sembunyikan Detil" : "Detil Lebih Lanjut"} <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </div>
      {isExpanded && (
        <div className="patrol-item-expanded-details">
          <div className="patrol-item-expanded-detail-group">
            <div className="patrol-item-expanded-detail-container patrol-item-duration">
              <strong>
                <FontAwesomeIcon icon={faClock} />
                &nbsp;&nbsp; Durasi
              </strong>
              <span>{duration}</span>
            </div>
            <div className="patrol-item-expanded-detail-container patrol-item-distance">
              <strong>
                <FontAwesomeIcon icon={faRoute} />
                &nbsp;&nbsp; Jarak Tempuh
              </strong>
              <span>{isNaN(task.distance) ? "Tidak Tersedia" : `${(task.distance / 1000).toFixed(2)} km`}</span>
            </div>
          </div>
          <div className="patrol-item-expanded-detail-group">
            <div className="patrol-item-expanded-detail-container">
              <strong>Foto Laporan Awal</strong>
              {task.initialReportPhotoUrl ? (
                <div>
                  <img src={task.initialReportPhotoUrl} alt="Initial Report" className="patrol-photo" />
                </div>
              ) : (
                <span>Tidak Tersedia</span>
              )}
            </div>
            <div className="patrol-item-expanded-detail-container patrol-item-final-photo-report">
              <strong>Foto Laporan Akhir</strong>
              {task.finalReportPhotoUrl ? (
                <div>
                  <img src={task.finalReportPhotoUrl} alt="Final Report" className="patrol-photo" />
                </div>
              ) : (
                <span>Tidak Tersedia</span>
              )}
            </div>
          </div>
          {relatedIncidents.length > 0 && (
            <div className="patrol-item-incidents">
              <strong>Insiden</strong>
              <div className="patrol-item-incident-list">
                {relatedIncidents.map(incident => (
                  <IncidentItem key={incident.id} incident={incident} onViewClick={handleIncidentViewClick} />
                ))}
              </div>
            </div>
          )}
          <div className="patrol-item-fake-gps">
            {task.mock_detections && (
              <div className="patrol-item-mock-detections">
                <strong>Deteksi Fake GPS</strong>
                <div className="patrol-item-mock-detections-items">
                  {task.mock_detections &&
                    Object.keys(task.mock_detections).map((key, index) => (
                      <MockDetectionItem
                        key={index}
                        detection={task.mock_detections[key]}
                        onClick={() => handleMockLocationClick(task, task.mock_detections[key])}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentItem({ incident, onViewClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null); // Create a reference for the card

  const toggleDetails = () => {
    setIsExpanded(prev => !prev);
  };

  const photoUrls = incident.photoUrl ? incident.photoUrl.split(",") : [];

  return (
    <div ref={cardRef} className="incident-card patrol-item-incident-card">
      <div className="incident-content-container">
        <div className="incident-content patrol-item-incident-content">
          <div className="incident-title patrol-item-incident-title">{incident.title}</div>
          <div className="incident-timestamp">
            <FontAwesomeIcon icon={faClock} style={{ color: "#3535F3" }} />
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
            <FontAwesomeIcon icon={faLocationDot} style={{ color: "#3535F3" }} />
            &nbsp;&nbsp;&nbsp;
            {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
          </div>
        </div>
        <div>
          <button
            className="incident-view-on-map-button patrol-incident-view-on-map-button"
            onClick={() => onViewClick(incident)}
          >
            Lihat di Peta
          </button>
        </div>
      </div>
      <button className="dropdown-button patrol-incident-dropdown-button" onClick={toggleDetails}>
        {isExpanded ? "Sembunyikan Detil" : "Detil Lebih Lanjut"}
        <span className="dropdown-icon">
          {isExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
        </span>
      </button>
      {isExpanded && (
        <div className="incident-extra-details">
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

function MockDetectionItem({ detection, onClick }) {
  return (
    <div className="patrol-item-mock-detections-item-container">
      <div className="patrol-item-mock-detections-item">
        <strong>
          {`${new Date(detection.timestamp).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })} ${new Date(detection.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          })}`}
        </strong>
        <div>
          <FontAwesomeIcon icon={faLocationDot} style={{ color: "#9F1D1B" }} />
          &nbsp;&nbsp;&nbsp;
          {detection.coordinates[0].toFixed(5)}, {detection.coordinates[1].toFixed(5)}
        </div>
      </div>
      <button className="patrol-item-mock-detections-view-on-map-button" onClick={onClick}>
        Lihat di Peta
      </button>
    </div>
  );
}

export default Patrols;
