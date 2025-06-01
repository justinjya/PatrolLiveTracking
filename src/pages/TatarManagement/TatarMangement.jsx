import {
  faChevronDown,
  faChevronUp,
  faCity,
  faEnvelope,
  faLocationDot,
  faLock
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import React, { useState } from "react";
import Input from "../../components/Input/Input";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { shiftLabels, typeLabels } from "../../utils/OfficerLabels";
import "./TatarManagement.css";

function TatarManagement() {
  const { markers, setSelectedCluster, isEditing, setIsEditing, setMarkers, clearTempPatrolPoints } =
    useMapDataContext();
  const [isAddingTatar, setIsAddingTatar] = useState(false);

  const toggleEditingTatar = () => {
    setIsAddingTatar(prev => !prev);
    clearTempPatrolPoints(); // Clear any temporary patrol points when toggling Tatar editing
    if (isEditing === "Patrol Points") {
      setIsEditing(null); // Reset editing state if currently editing patrol points
    }
  };

  const toggleEditingPatrolPoints = cluster => {
    setIsEditing("Patrol Points");

    if (cluster) {
      setMarkers(prev => ({
        ...prev,
        tempPatrolPoints: cluster.cluster_coordinates || []
      }));
    }
  };

  return (
    <div className="tatar-management">
      <div className="tatar-management-header">
        <h3 className="tatar-management-title">List of Tatars</h3>
        <button className="add-tatar-button" onClick={toggleEditingTatar}>
          {isAddingTatar ? "Cancel" : "Add Tatar"}
        </button>
      </div>
      <div className="tatar-list">
        {isAddingTatar && (
          <div className="add-tatar-form-container">
            <h4 className="tatar-management-title">Add New Tatar</h4>
            <form className="add-tatar-form">
              <Input
                icon={faCity}
                type="text"
                id="name"
                name="name"
                placeholder="Tatar Name"
                position="left"
                required
              />
              <Input
                icon={faEnvelope}
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                position="left"
                required
              />
              <Input
                icon={faLock}
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                position="left"
                required
              />
              <Input
                icon={faLock}
                type="password"
                id="confirm-password"
                name="confirm-password"
                placeholder="Confirm Password"
                position="left"
                required
              />
              <button
                className="tatar-form-button"
                disabled={isEditing === "Patrol Points"}
                onClick={() => toggleEditingPatrolPoints(null)}
              >
                Edit Patrol Points
              </button>
              <button className="tatar-form-button" disabled={isEditing === "Patrol Points"} type="submit">
                Submit
              </button>
            </form>
            <div className="separator" />
          </div>
        )}
        {markers.tatars.map(tatar => (
          <TatarCard
            key={tatar.id}
            tatar={tatar}
            isEditing={isEditing}
            setSelectedCluster={setSelectedCluster}
            onEditPatrolPointsClick={() => toggleEditingPatrolPoints(tatar)}
          />
        ))}
      </div>
    </div>
  );
}

function TatarCard({ tatar, isEditing, setSelectedCluster, onEditPatrolPointsClick, onDeleteTatarClick }) {
  const map = useMap();
  const [isOfficersExpanded, setIsOfficersExpanded] = useState(false);

  const toggleOfficersDropdown = () => {
    setIsOfficersExpanded(prev => !prev);
  };

  const viewOnMap = () => {
    // Calculate the center of the cluster_coordinates
    const center = tatar.cluster_coordinates.reduce(
      (acc, [lat, lng]) => {
        acc.lat += lat;
        acc.lng += lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    center.lat /= tatar.cluster_coordinates.length;
    center.lng /= tatar.cluster_coordinates.length;

    setSelectedCluster(tatar);
    map.setCenter(center); // Set the map center to the calculated center
    map.setZoom(17); // Zoom in to focus on the cluster
  };

  const handleEditPatrolPointsClick = () => {
    // Calculate the center of the cluster_coordinates
    const center = tatar.cluster_coordinates.reduce(
      (acc, [lat, lng]) => {
        acc.lat += lat;
        acc.lng += lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    center.lat /= tatar.cluster_coordinates.length;
    center.lng /= tatar.cluster_coordinates.length;

    map.setCenter(center); // Set the map center to the calculated center
    map.setZoom(17); // Zoom in to focus on the cluster

    onEditPatrolPointsClick(); // Trigger the patrol points editing
  };

  return (
    <div className="tatar-item">
      <div className="tatar-contents-container">
        <div className="tatar-contents">
          <div className="tatar-name">{tatar.name}</div>
          <div className="tatar-email">
            <FontAwesomeIcon icon={faEnvelope} />
            &nbsp;&nbsp;&nbsp;
            {tatar.email}
          </div>
          <div className="tatar-coordinates">
            <FontAwesomeIcon icon={faLocationDot} />
            &nbsp;&nbsp;&nbsp;
            {tatar.cluster_coordinates ? tatar.cluster_coordinates.length : 0} Patrol Points
          </div>
        </div>
        <div>
          <button className="tatar-view-on-map-button" onClick={viewOnMap}>
            View on Map
          </button>
        </div>
      </div>

      <div className="tatar-actions">
        <button
          className="tatar-edit-patrol-points-button"
          disabled={isEditing === "Patrol Points"}
          onClick={handleEditPatrolPointsClick}
        >
          Edit Patrol Points
        </button>
        <button
          className="tatar-delete-tatar-button"
          disabled={isEditing === "Patrol Points"}
          onClick={onDeleteTatarClick}
        >
          Delete Tatar
        </button>
      </div>

      {/* Expandable Section for Officers */}
      {tatar.officers && Object.keys(tatar.officers).length > 0 && (
        <>
          <button className="dropdown-button" onClick={toggleOfficersDropdown}>
            {isOfficersExpanded
              ? `Hide Officers (${Object.keys(tatar.officers).length})`
              : `Show Officers (${Object.keys(tatar.officers).length})`}
            <span className="dropdown-icon">
              {isOfficersExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
            </span>
          </button>
          {isOfficersExpanded && (
            <div className="officer-list">
              {Object.values(tatar.officers).map(officer => (
                <OfficerCard key={officer.id} officer={officer} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OfficerCard({ officer }) {
  return (
    <div className="officer-card">
      <div className="officer-details">
        <div className="officer-name">{officer.name}</div>
        <div className="officer-badges">
          <div
            className="officer-badge"
            style={typeLabels[officer.type]?.style || {}} // Apply dynamic styles based on type
          >
            {typeLabels[officer.type]?.label || officer.type}
          </div>
          <div className="officer-badge shift-badge">{shiftLabels[officer.shift] || officer.shift}</div>
        </div>
      </div>
    </div>
  );
}

export default TatarManagement;
