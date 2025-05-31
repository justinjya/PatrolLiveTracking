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
  const { setSelectedIncident, isEditing, clearPolylines, setSelectedCluster } = useMapDataContext();

  useEffect(() => {
    if (isEditing) {
      closeSidebar();
    }
  }, [isEditing]);

  return (
    <div style={{ display: "flex" }}>
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
                onClick: () => handleMenuClick(child.props.label, child.props.children || child.props.pageComponent)
              })
            )}
          </div>
        </div>
      </div>

      {/* Secondary Sidebar */}
      {activeMenu && (
        <SecondarySidebar
          onClose={() => {
            closeSecondarySidebar();
            clearPolylines();
            setSelectedIncident(null); // Reset selected incident when closing the sidebar
            setSelectedCluster(null); // Reset selected cluster when closing the sidebar
          }}
          title={activeMenu}
        >
          {secondaryContent}
        </SecondarySidebar>
      )}
    </div>
  );
}

function ToggleButton({ isCollapsed, onToggle, activeMenu }) {
  return (
    <div className="sidebar-toggle-button-container">
      <button
        className="sidebar-toggle-button"
        onClick={onToggle}
        style={{ visibility: activeMenu ? "hidden" : "visible" }} // Hide button if there's an active menu
      >
        {isCollapsed ? ">" : "X"}
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
      <span className="sidebar-menu-icon">{icon}</span>
      {!isCollapsed && <span className="sidebar-menu-label">{label}</span>}
    </div>
  );
}

export { MenuItem, Sidebar };
