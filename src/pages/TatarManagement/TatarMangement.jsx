import {
  faChevronDown,
  faChevronUp,
  faCircleNotch,
  faEnvelope,
  faLocationDot,
  faPen,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import { push, ref, remove, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import Input from "../../components/Input/Input";
import { useFirebase } from "../../contexts/FirebaseContext";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { shiftOptions, typeOptions } from "../../utils/OfficerOptions";
import "./TatarManagement.css";

function TatarManagement() {
  const { markers, setSelectedCluster } = useMapDataContext();

  return (
    <div className="tatar-management">
      <h3 className="tatar-management-title">Daftar Tatar</h3>
      <div className="tatar-list">
        {markers.tatars.length === 0 ? (
          <div className="no-tasks-message">Tidak ada tatar yang tersedia</div>
        ) : (
          markers.tatars.map(tatar => (
            <TatarCard key={tatar.id} tatar={tatar} setSelectedCluster={setSelectedCluster} />
          ))
        )}
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
            {tatar.cluster_coordinates ? tatar.cluster_coordinates.length : 0} Titik Patroli
          </div>
        </div>
        <div>
          <button className="tatar-view-on-map-button" onClick={viewOnMap}>
            Lihat di Peta
          </button>
        </div>
      </div>

      {/* Expandable Section for Officers */}
      {tatar.officers && Object.keys(tatar.officers).length > 0 && (
        <>
          <button className="dropdown-button" onClick={toggleOfficersDropdown}>
            {isOfficersExpanded
              ? `Sembunyikan Petugas (${Object.keys(tatar.officers).length})`
              : `Tampilkan Petugas (${Object.keys(tatar.officers).length})`}
            <span className="dropdown-icon">
              {isOfficersExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
            </span>
          </button>
          {isOfficersExpanded && (
            <>
              <div className="officer-list-header">
                <button className="add-officer-button" onClick={toggleAddingOfficer}>
                  {isAddingOfficer ? "Batal" : "Tambah Petugas"}
                </button>
              </div>
              {isAddingOfficer && (
                <>
                  <OfficerForm
                    tatar={tatar}
                    onCancel={() => {
                      setIsAddingOfficer(false);
                    }}
                  />
                  <div className="separator" />
                </>
              )}
              <div className="officer-list">
                {Object.values(tatar.officers).map(officer => (
                  <OfficerCard key={officer.id} tatar={tatar} officer={officer} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function OfficerCard({ tatar, officer }) {
  const { db } = useFirebase();
  const [isEditingOfficer, setIsEditingOfficer] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false); // State for delete confirmation
  const [isDeleting, setIsDeleting] = useState(false); // State for delete loading

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

  const handleDeleteOfficer = async () => {
    try {
      setIsDeleting(true); // Set loading state to true
      const officerRef = ref(db, `users/${tatar.id}/officers/${officer.id}`);
      await remove(officerRef); // Delete the officer from Firebase
    } catch (error) {
      console.error("Error deleting officer:", error);
    } finally {
      setIsDeleting(false); // Set loading state to false
      setIsConfirmingDelete(false); // Close confirmation dialog
    }
  };

  if (isEditingOfficer) {
    return (
      <>
        <div className="separator" />
        <OfficerForm tatar={tatar} officer={officer} onCancel={() => setIsEditingOfficer(false)} />
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
        {isConfirmingDelete ? (
          <>
            <button
              className="officer-card-button confirm-delete-button"
              onClick={handleDeleteOfficer}
              disabled={isDeleting} // Disable the button while deleting
            >
              {isDeleting ? <FontAwesomeIcon icon={faCircleNotch} spin /> : <strong>Hapus</strong>}
            </button>
            <button className="officer-card-button cancel-button" onClick={() => setIsConfirmingDelete(false)}>
              Batal
            </button>
          </>
        ) : (
          <>
            <button className="officer-card-button delete-button" onClick={() => setIsConfirmingDelete(true)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function OfficerForm({ tatar, officer = {}, onCancel }) {
  const { db } = useFirebase();
  const [name, setName] = useState(officer.name || "");
  const [type, setType] = useState(officer.type || "");
  const [shift, setShift] = useState(officer.shift || "");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  // Validate the form manually
  useEffect(() => {
    if (officer.id) {
      // If editing an officer, form is valid only if there are changes
      const hasChanges =
        name.trim() !== (officer.name || "").trim() ||
        type.trim() !== (officer.type || "").trim() ||
        shift.trim() !== (officer.shift || "").trim();
      setIsFormValid(hasChanges);
    } else {
      // If adding a new officer, form is valid if all fields are filled
      setIsFormValid(name.trim() !== "" && type.trim() !== "" && shift.trim() !== "");
    }
  }, [name, type, shift, officer]);

  const handleSubmit = async event => {
    event.preventDefault();
    setIsLoading(true); // Set loading state to true

    try {
      const officersRef = ref(db, `users/${tatar.id}/officers`); // Reference to the "officers" document under the specific cluster

      if (officer.id) {
        // Update existing officer
        const existingOfficerRef = ref(db, `users/${tatar.id}/officers/${officer.id}`);
        const updatedOfficer = {
          ...officer, // Keep existing officer properties
          name: name.trim(),
          shift,
          type
        };
        await set(existingOfficerRef, updatedOfficer); // Update the officer in Firebase
      } else {
        // Create a new officer
        const newOfficerRef = push(officersRef); // Create a new officer entry
        const newOfficer = {
          cluster_id: tatar.id,
          id: newOfficerRef.key, // Use the generated key as the officer ID
          name: name.trim(),
          shift,
          type
        };
        await set(newOfficerRef, newOfficer); // Save the new officer to Firebase
      }
    } catch (error) {
      console.error("Error saving officer to Firebase:", error);
    } finally {
      setIsLoading(false); // Set loading state to false
    }

    onCancel(); // Close the form after submission
  };

  return (
    <div className="officer-form-container">
      <div className="tatar-management-header">
        <h4 className="tatar-management-title">{officer.id ? "Edit Petugas" : "Tambah Petugas"}</h4>
        {officer.id && (
          <button className="tatar-form-cancel-button" type="button" onClick={onCancel}>
            Batal
          </button>
        )}
      </div>
      <form className="officer-form" onSubmit={handleSubmit} autoComplete="off">
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Officer Name"
          required
          defaultValue={name}
          onChange={e => setName(e.target.value)}
        />
        <Input
          type="dropdown"
          id="type"
          name="type"
          placeholder="Officer Type"
          options={typeOptions}
          required
          defaultValue={type}
          onChange={value => setType(value)}
        />
        <Input
          type="dropdown"
          id="shift"
          name="shift"
          placeholder="Officer Shift"
          options={shiftOptions}
          required
          defaultValue={shift}
          onChange={value => setShift(value)}
        />
        <div className="tatar-form-button-group">
          <button
            className="tatar-form-button tatar-form-submit-button"
            type="submit"
            disabled={!isFormValid || isLoading} // Disable button if form is invalid or loading
          >
            {isLoading ? <FontAwesomeIcon icon={faCircleNotch} spin /> : officer.id ? "Simpan Perubahan" : "Kirim"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TatarManagement;
