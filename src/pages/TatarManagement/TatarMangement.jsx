import {
  faChevronDown,
  faChevronUp,
  faCity,
  faEnvelope,
  faLocationDot,
  faLock,
  faPen,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import React, { useState } from "react";
import Input from "../../components/Input/Input";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { shiftOptions, typeOptions } from "../../utils/OfficerOptions";
import "./TatarManagement.css";

function TatarManagement() {
  const { markers, setSelectedCluster, isEditing, setIsEditing, setMarkers, clearTempPatrolPoints } =
    useMapDataContext();
  const [isAddingTatar, setIsAddingTatar] = useState(false);
  const [selectedTatar, setSelectedTatar] = useState(null); // Track the currently selected Tatar for editing

  const toggleEditingTatar = () => {
    setSelectedTatar(null); // Reset selected Tatar when toggling Tatar editing
    setIsAddingTatar(prev => !prev);
    clearTempPatrolPoints(); // Clear any temporary patrol points when toggling Tatar editing
    if (isEditing === "Patrol Points") {
      setIsEditing(null); // Reset editing state if currently editing patrol points
    }
  };

  const toggleEditingPatrolPoints = cluster => {
    if (isEditing === "Patrol Points") {
      setIsEditing(null); // Reset editing state if currently editing patrol points
      setSelectedTatar(null); // Reset selected Tatar
      return;
    }

    setIsEditing("Patrol Points");

    if (cluster) {
      setSelectedTatar(cluster); // Set the selected Tatar for editing
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
              <span className="edit-patrol-point-hint">
                Click on the map to add patrol points. You need at least 3 points to define an area.
              </span>
              <button className="tatar-form-button" onClick={() => toggleEditingPatrolPoints(null)}>
                {isEditing === "Patrol Points" ? "Save Changes" : "Edit Patrol Points"}
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
            isSelected={selectedTatar?.id === tatar.id} // Pass whether this Tatar is selected
          />
        ))}
      </div>
    </div>
  );
}

function TatarCard({ tatar, isEditing, setSelectedCluster, onEditPatrolPointsClick, onDeleteTatarClick, isSelected }) {
  const map = useMap();
  const [isOfficersExpanded, setIsOfficersExpanded] = useState(false);
  const [isAddingOfficer, setIsAddingOfficer] = useState(false);

  const toggleOfficersDropdown = () => {
    setIsOfficersExpanded(prev => !prev);
    setIsAddingOfficer(false); // Reset adding officer state when toggling dropdown
  };

  const toggleAddingOfficer = () => {
    setIsAddingOfficer(prev => !prev);
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

  const handleEditPatrolPoints = () => {
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
    onEditPatrolPointsClick();
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
          onClick={handleEditPatrolPoints}
          disabled={isEditing === "Patrol Points" && !isSelected} // Disable if editing another Tatar's points
        >
          {isEditing === "Patrol Points" && isSelected ? "Save Changes" : "Edit Patrol Points"}
        </button>
        <button
          className="tatar-delete-tatar-button"
          disabled={isEditing === "Patrol Points"} // Disable delete button while editing patrol points
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
            <>
              <div className="officer-list-header">
                <button className="add-officer-button" onClick={toggleAddingOfficer}>
                  {isAddingOfficer ? "Cancel" : "Add Officer"}
                </button>
              </div>
              {isAddingOfficer && (
                <>
                  <OfficerForm
                    onCancel={() => {
                      setIsAddingOfficer(false);
                      setEditingOfficer(null);
                    }}
                  />
                  <div className="separator" />
                </>
              )}
              <div className="officer-list">
                {Object.values(tatar.officers).map(officer => (
                  <OfficerCard key={officer.id} officer={officer} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function OfficerCard({ officer }) {
  const [isEditingOfficer, setIsEditingOfficer] = useState(false);

  // Find the type label and style from typeOptions
  const typeOption = typeOptions.find(option => option.value === officer.type);
  const typeLabel = typeOption?.label || officer.type;
  const typeStyle = typeOption?.style || {};

  // Find the shift label from shiftOptions
  const shiftOption = shiftOptions.find(option => option.value === officer.shift);
  const shiftLabel = shiftOption?.label || officer.shift;

  const toggleEditOfficer = () => {
    setIsEditingOfficer(prev => !prev);
  };

  if (isEditingOfficer) {
    return (
      <>
        <div className="separator" />
        <OfficerForm officer={officer} onCancel={() => setIsEditingOfficer(false)} />
        <div className="separator" />
      </>
    );
  }

  return (
    <div className="officer-card">
      <div className="officer-details">
        <div className="officer-name">{officer.name}</div>
        <div className="officer-badges">
          <div className="officer-badge" style={typeStyle}>
            {typeLabel}
          </div>
          <div className="officer-badge shift-badge">{shiftLabel}</div>
        </div>
      </div>
      <div className="officer-card-button-group">
        <button className="officer-card-button" onClick={toggleEditOfficer}>
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button className="officer-card-button delete-button">
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
}

function OfficerForm({ officer = {}, onSubmit, onCancel }) {
  return (
    <div className="officer-form-container">
      <h4 className="tatar-management-title">{officer.id ? "Edit Officer" : "Add New Officer"}</h4>
      <form className="officer-form" onSubmit={onSubmit}>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Officer Name"
          required
          defaultValue={officer.name || ""}
        />
        <Input
          type="dropdown"
          id="type"
          name="officer-type"
          placeholder="Officer Type"
          options={typeOptions}
          required
          defaultValue={officer.type || ""}
        />
        <Input
          type="dropdown"
          id="shift"
          name="officer-shift"
          placeholder="Officer Shift"
          options={shiftOptions}
          required
          defaultValue={officer.shift || ""}
        />
        <div className="tatar-form-button-group">
          {officer.id && (
            <button className="tatar-form-button tatar-form-cancel-button" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button className="tatar-form-button tatar-form-submit-button" type="submit">
            {officer.id ? "Save Changes" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TatarManagement;
