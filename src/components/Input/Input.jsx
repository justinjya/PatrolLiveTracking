import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "./Input.css"; // Import the CSS file

function Input({ icon, type, name, id, placeholder, required, style, position }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev);
  };

  const inputType = type === "password" && isPasswordVisible ? "text" : type;

  return (
    <div className={`input-container ${position ? (position === "right" ? "icon-right" : "icon-left") : ""}`}>
      {icon && position && <FontAwesomeIcon icon={icon} className="input-icon" />}
      <input
        className={`input ${position ? (position === "right" ? "icon-right" : "icon-left") : ""}`}
        type={inputType}
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        style={style} // Allow additional inline styles if needed
      />
      {type === "password" && (
        <FontAwesomeIcon
          icon={isPasswordVisible ? faEyeSlash : faEye}
          className="password-toggle-icon"
          onClick={togglePasswordVisibility}
        />
      )}
    </div>
  );
}

export default Input;