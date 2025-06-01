import { faChevronRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import { useSidebarContext } from "../../contexts/SidebarContext"; // Import the context
import SecondarySidebar from "../SecondarySidebar/SecondarySidebar";
import "./Sidebar.css";

function Sidebar({ children }) {
  const {
    isCollapsed,
    activeMenu,
    secondaryContent,
    toggleSidebar,
    closeSidebar,
    handleMenuClick,
    closeSecondarySidebar
  } = useSidebarContext();
  const { isEditing, setSelectedTask, setSelectedIncident, setSelectedCluster, clearPolylines, clearTempPatrolPoints } = useMapDataContext();

  useEffect(() => {
    if (isEditing === "Cameras") {
      closeSidebar();
    }
  }, [isEditing]);

  return (
    <div className="sidebar-container">
      {/* Primary Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-content">
          {/* Toggle Button */}
          <ToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} activeMenu={activeMenu} />

          {/* Render Menu Items */}
          <div className="sidebar-menu">
            {React.Children.map(children, child =>
              React.cloneElement(child, {
                isCollapsed,
                isSelected: child.props.label === activeMenu, // Check if the menu is active
                onClick: () => {
                  if (isEditing) return;

                  handleMenuClick(child.props.label, child.props.children || child.props.pageComponent)
                  setSelectedTask(null); // Reset selected task when switching menus
                  setSelectedIncident(null); // Reset selected incident when switching menus
                  setSelectedCluster(null); // Reset selected cluster when switching menus
                  clearTempPatrolPoints(); // Clear temporary patrol points when switching menus
                  clearPolylines(); // Clear polylines when switching menus
                }
              })
            )}
          </div>
        </div>
      </div>

      {/* Secondary Sidebar */}
      <div className="sidebar-secondary-sidebar">
        <SecondarySidebar
          activeMenu={activeMenu}
          onClose={() => {
            if (isEditing) return; // Prevent closing if in editing mode
            
            closeSecondarySidebar();
            setSelectedTask(null); // Reset selected task when closing the sidebar
            setSelectedIncident(null); // Reset selected incident when closing the sidebar
            setSelectedCluster(null); // Reset selected cluster when closing the sidebar
            clearTempPatrolPoints(); // Clear temporary patrol points when closing the sidebar
            clearPolylines();
          }}
          title={activeMenu}
        >
          {secondaryContent}
        </SecondarySidebar>
      </div>
    </div>
  );
}

function ToggleButton({ isCollapsed, onToggle, activeMenu }) {
  return (
    <div className="sidebar-toggle-button-container">
      <button
        className={`sidebar-toggle-button ${activeMenu ? "active" : ""}`}
        onClick={onToggle}
      >
        {isCollapsed ? <FontAwesomeIcon icon={faChevronRight} /> : <FontAwesomeIcon icon={faXmark} />}
      </button>
    </div>
  );
}

function MenuItem({ icon, label, isCollapsed, onClick, isSelected }) {
  return (
    <div
      className={`sidebar-menu-item ${isSelected ? "selected" : ""}`} // Add 'selected' class if the menu is active
      onClick={onClick}
    >
      <span className={`sidebar-menu-icon ${isSelected ? "selected" : ""}`}>{icon}</span>
      {!isCollapsed && <span className="sidebar-menu-label">{label}</span>}
    </div>
  );
}

export { MenuItem, Sidebar };
