import React, { useState } from "react";
import "./ExpandableMenu.css";

function ExpandableMenu({ icon = "...", children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="expandable-menu">
      <button className="expandable-menu-button" onClick={toggleMenu}>
        {icon}
      </button>
      {isExpanded && <div className="expandable-menu-content">{children}</div>}
    </div>
  );
}

export default ExpandableMenu;