import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faChevronDown, faChevronUp, faCity, faLocationDot, faRoute, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import { push, ref, set } from "firebase/database";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Input from "../../components/Input/Input";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { shiftOptions, typeOptions } from "../../utils/OfficerOptions";
import { timelinessLabels } from "../../utils/TimelinessLabels";
import "./Patrols.css";

function Patrols() {
  const { db } = useFirebase();
  const {
    markers,
    selectedTask,
    setSelectedTask,
    setSelectedCluster,
    checkIntersection,
    isEditing,
    setIsEditing,
    clearPolylines,
    tempPatrolPoints,
    setTempPatrolPoints,
    setLoading
  } = useMapDataContext(); // Access global methods and state
  const map = useMap(); // Access the map instance
  const itemRefs = useRef({});

  const [isAddingPatrol, setIsAddingPatrol] = useState(false);
  const [tatar, setTatar] = useState(""); // State to hold the selected tatar
  const [officer, setOfficer] = useState(""); // State to hold the selected officer
  const [startDateTime, setStartDateTime] = useState({ day: "", month: "", year: "", hour: "", minute: "" });
  const [endDateTime, setEndDateTime] = useState({ day: "", month: "", year: "", hour: "", minute: "" });

  // Find the selected tatar object
  const tatarObj = tatar ? markers.tatars.find(t => t.id === tatar) : null;
  const officerOptions = tatarObj
    ? Object.values(tatarObj?.officers || {}).map(officer => ({
        label: officer.name, // Display the officer name
        value: officer.id // Pass the officer ID as the value
      }))
    : []; // Default to an empty array if no tatar is selected

  // Find the selected officer details
  const officerObj = Object.values(tatarObj?.officers || {}).find(o => o.id === officer) || null;

  // Find the type label and style from typeOptions
  const typeOption = typeOptions.find(option => option.value === officerObj?.type);
  const typeLabel = typeOption?.label || officerObj?.type || "Unknown";
  const typeStyle = typeOption?.style || {};

  // Find the shift label from shiftOptions
  const shiftOption = shiftOptions.find(option => option.value === officerObj?.shift);
  const shiftLabel = shiftOption?.label || officerObj?.shift || "Unknown";

  const statusLabels = {
    ontime: "Tepat Waktu",
    late: "Terlambat",
    expired: "Kadaluarsa",
    active: "Aktif",
    idle: "Tidak Aktif",
    "Unknown Timeliness": "Tidak Diketahui",
    "Unknown Status": "Tidak Diketahui"
  };

  const handleDateTimeChange = (setDateTime, newValue) => {
    setDateTime(prevDateTime => ({
      ...prevDateTime, // Keep the existing values
      ...newValue // Update only the changed segment
    }));
  };

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

  const toggleAddPatrol = () => {
    setIsAddingPatrol(prev => !prev);

    // Reset temporary patrol points and selected task
    setTempPatrolPoints([]); // Clear temporary patrol points when cancelling
    setSelectedTask(null); // Reset selected task when starting to add a patrol
    setSelectedCluster(null); // Reset selected cluster when starting to add a patrol
    clearPolylines(); // Clear any drawn polylines

    // Reset tatar, officer, and date/time states
    setTatar(""); // Reset tatar selection
    setOfficer(""); // Reset officer selection
    // Reset date/time states
    setStartDateTime({ day: "", month: "", year: "", hour: "", minute: "" });
    setEndDateTime({ day: "", month: "", year: "", hour: "", minute: "" });
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
    if (selectedTask && selectedTask.id === task.id) {
      // If the same task is clicked, deselect it
      setSelectedTask(null);
      clearPolylines();
      return;
    }

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

  const calculateAndSetCenter = (map, coordinates, zoomLevel = 17) => {
    if (!coordinates || coordinates.length === 0) {
      console.warn("No coordinates provided to calculate center.");
      return;
    }

    // Calculate the center of the coordinates
    const center = coordinates.reduce(
      (acc, [lat, lng]) => {
        acc.lat += lat;
        acc.lng += lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    center.lat /= coordinates.length;
    center.lng /= coordinates.length;

    // Set the map's center and zoom level
    if (map) {
      map.setCenter(center);
      map.setZoom(zoomLevel);
    }

    return center; // Return the calculated center
  };

  const toggleEditingPatrolPoints = () => {
    if (isEditing === "Patrol Points") {
      setIsEditing(null); // Reset editing state if currently editing patrol points
      return;
    }
    setIsEditing("Patrol Points");
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

  const isFormValid = () => {
    // Check if all required fields are filled
    const isStartDateTimeValid =
      startDateTime.day &&
      startDateTime.month &&
      startDateTime.year &&
      startDateTime.hour !== "" &&
      startDateTime.minute !== "";
    const isEndDateTimeValid =
      endDateTime.day && endDateTime.month && endDateTime.year && endDateTime.hour !== "" && endDateTime.minute !== "";

    if (!tatar || !officer || !isStartDateTimeValid || !isEndDateTimeValid) {
      return false; // Form is incomplete
    }

    // Construct full Date objects for start and end times
    const startDate = new Date(
      startDateTime.year,
      startDateTime.month - 1, // JavaScript months are 0-indexed
      startDateTime.day,
      startDateTime.hour,
      startDateTime.minute
    );
    const endDate = new Date(
      endDateTime.year,
      endDateTime.month - 1, // JavaScript months are 0-indexed
      endDateTime.day,
      endDateTime.hour,
      endDateTime.minute
    );

    // Ensure endDate is not before startDate
    if (endDate <= startDate) {
      return false; // End date must be after start date
    }

    // Validate date-time inputs based on the officer's shift
    const shiftDetails = shiftOptions.find(option => option.value === officerObj.shift);
    if (shiftDetails) {
      const { minTime, maxTime } = shiftDetails;

      const parseTime = time => {
        const [hour, minute] = time.split(":").map(Number);
        return new Date(0, 0, 0, hour, minute); // Create a Date object for comparison
      };

      const shiftStartTime = parseTime(minTime);
      const shiftEndTime = parseTime(maxTime);

      // Extract only the time portion of startDate and endDate for comparison
      const startTime = new Date(0, 0, 0, startDate.getHours(), startDate.getMinutes());
      const endTime = new Date(0, 0, 0, endDate.getHours(), endDate.getMinutes());

      // Handle shifts that span midnight (e.g., "23:00" to "07:00")
      const isStartTimeValid =
        shiftStartTime <= shiftEndTime
          ? startTime >= shiftStartTime && startTime <= shiftEndTime
          : startTime >= shiftStartTime || startTime <= shiftEndTime;

      const isEndTimeValid =
        shiftStartTime <= shiftEndTime
          ? endTime >= shiftStartTime && endTime <= shiftEndTime
          : endTime >= shiftStartTime || endTime <= shiftEndTime;

      if (!isStartTimeValid || !isEndTimeValid) {
        return false; // Start or end time is outside the shift range
      }
    }

    return true; // Form is valid
  };

  const handleSubmit = async e => {
    e.preventDefault(); // Prevent default form submission behavior

    // Prepare the data for the new task
    const newTask = {
      clusterId: tatarObj.id, // Selected cluster ID
      clusterName: tatarObj.name, // Selected cluster name
      assigned_route: tempPatrolPoints, // Selected patrol points
      userId: officerObj.id, // Selected officer ID
      officerName: officerObj.name, // Selected officer name
      assignedStartTime: new Date(
        startDateTime.year,
        startDateTime.month - 1, // JavaScript months are 0-indexed
        startDateTime.day,
        startDateTime.hour,
        startDateTime.minute
      ).toISOString(), // Convert to ISO string
      assignedEndTime: new Date(
        endDateTime.year,
        endDateTime.month - 1,
        endDateTime.day,
        endDateTime.hour,
        endDateTime.minute
      ).toISOString(), // Convert to ISO string
      status: "active", // Default status for a new task
      createdAt: new Date().toISOString() // Current timestamp
    };

    try {
      // Simulate adding the task to the database (replace with actual API call)
      setLoading(true); // Set loading state to true

      const tasksRef = ref(db, "tasks"); // Reference to the "officers" document under the specific cluster
      const newTaskRef = push(tasksRef); // Create a new task reference
      await set(newTaskRef, newTask); // Set the new task data
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false); // Set loading state to false after submission

      // Reset the form after successful submission
      setTatar("");
      setOfficer("");
      setStartDateTime({ day: "", month: "", year: "", hour: "", minute: "" });
      setEndDateTime({ day: "", month: "", year: "", hour: "", minute: "" });
      setTempPatrolPoints([]);
      setSelectedCluster(null);
      setIsAddingPatrol(false); // Close the form
      setIsEditing(null); // Reset editing state
    }
  };

  useEffect(() => {
    // Automatically scroll to the selected task if it exists
    if (selectedTask && itemRefs.current[selectedTask.id]) {
      itemRefs.current[selectedTask.id].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedTask?.id]);

  return (
    <div className="patrols-page">
      <div className="patrols-header">
        <h3 className="patrols-title">Daftar Patroli</h3>
        <button className="add-patrol-button" onClick={toggleAddPatrol}>
          {isAddingPatrol ? "Batal" : "Tambah Patroli"}
        </button>
      </div>
      <div className="patrols-list">
        {isAddingPatrol && (
          <div className="add-tatar-form-container">
            <h4 className="tatar-management-title">Tambah Patroli</h4>
            <form className="add-tatar-form" onSubmit={handleSubmit}>
              <Input
                type="dropdown"
                id="tatar"
                name="tatar"
                placeholder="Tatar"
                options={markers.tatars.map(tatar => ({
                  label: tatar.name, // Display the tatar name
                  value: tatar.id // Use the tatar ID as the value
                }))}
                value={tatar}
                onChange={selectedValue => {
                  setTatar(selectedValue); // Update the selected tatar

                  const selectedTatar = markers.tatars.find(t => t.id === selectedValue);
                  setTempPatrolPoints(selectedTatar.cluster_coordinates || []);
                  setSelectedCluster(selectedTatar);
                  setOfficer("");

                  if (selectedTatar.cluster_coordinates) {
                    calculateAndSetCenter(map, selectedTatar.cluster_coordinates);
                  }
                }}
                required
              />
              <Input
                type="dropdown"
                id="officer"
                name="officer"
                placeholder="Petugas"
                options={officerOptions}
                value={officer}
                disabled={tatar === ""}
                onChange={selectedValue => setOfficer(selectedValue)} // Update the selected officer
                required
              />
              <div className="patrol-item-badges">
                <div className="patrol-badge type-badge" style={typeStyle}>
                  {typeLabel}
                </div>
                <div className="patrol-badge shift-badge">{shiftLabel}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ display: "flex", flexDirection: "column", textAlign: "start", gap: "3px" }}>
                  <span className="patrol-form-label">Waktu Mulai</span>
                  <Input
                    type="datetime"
                    id="start-time"
                    name="start-time"
                    value={startDateTime}
                    onChange={newValue => handleDateTimeChange(setStartDateTime, newValue)}
                    required
                  />
                </div>
                <div style={{ padding: "20px" }}>-</div>
                <div style={{ display: "flex", flexDirection: "column", textAlign: "end", gap: "3px" }}>
                  <span className="patrol-form-label">Waktu Selesai</span>
                  <Input
                    type="datetime"
                    id="end-time"
                    name="end-time"
                    value={endDateTime}
                    onChange={newValue => handleDateTimeChange(setEndDateTime, newValue)}
                    required
                  />
                </div>
              </div>
              <span className="edit-patrol-point-hint">Klik pada peta untuk menentukan titik-titik patroli</span>
              <span className="edit-patrol-point-count">Titik dipilih: {tempPatrolPoints.length}</span>
              <button className="tatar-form-button" type="button" onClick={toggleEditingPatrolPoints}>
                {isEditing === "Patrol Points" ? "Simpan" : "Edit Titik Patroli"}
              </button>
              <button className="tatar-form-button" type="submit" disabled={!isFormValid()}>
                Kirim
              </button>
            </form>
            <div className="separator" />
          </div>
        )}
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
  const { markers, selectedTask, setSelectedTask, setSelectedIncident } = useMapDataContext(); // Access global methods and state

  const officerDetails = getOfficerDetails(task.clusterId, task.userId);
  const intersectionCount = checkIntersection(task.assigned_route, task.route_path).size;
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
        <div className="patrol-item-detail-group">
          <span className="patrol-item-timestamps patrol-item-assigned-start-time">
            <strong>Waktu Mulai</strong>
            {isNaN(new Date(task.assignedStartTime).getTime())
              ? "N/A"
              : `${new Date(task.assignedStartTime).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}, ${new Date(task.assignedStartTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                })}`}{" "}
          </span>
          <span className="patrol-item-timestamps patrol-item-time-range">
            <strong>Waktu Pelaksanaan</strong>
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
          {selectedTask && selectedTask.id === task.id ? "Sembunyikan dari Peta" : "Lihat di Peta"}
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
          <div className="incident-subtitle patrol-item-incident-subtitle">
            <FontAwesomeIcon icon={faCity} style={{ color: "#3535f3" }} />
            &nbsp;&nbsp;&nbsp;{incident.clusterName}
          </div>
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
