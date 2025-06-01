import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import "./Input.css"; // Import the CSS file

function Input({ icon, type, name, id, placeholder, required, style, position, options = [], defaultValue = "" }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const [selectedOption, setSelectedOption] = useState(() => {
    // Initialize selectedOption based on defaultValue matching either label or value
    const defaultOption = options.find(option => option.label === defaultValue || option.value === defaultValue);
    return defaultOption ? defaultOption.label : defaultValue;
  });
  const dropdownRef = useRef(null); // Ref for the dropdown container

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev);
  };

  const inputType = type === "password" && isPasswordVisible ? "text" : type;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Collapse dropdown
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (type === "dropdown") {
    // Render custom dropdown input
    return (
      <div
        ref={dropdownRef} // Attach ref to the dropdown container
        className={`input-container ${position ? (position === "right" ? "icon-right" : "icon-left") : ""}`}
      >
        {icon && position && <FontAwesomeIcon icon={icon} className="input-icon" />}
        <div
          className={`custom-dropdown ${position ? (position === "right" ? "icon-right" : "icon-left") : ""}`}
          style={style} // Allow additional inline styles if needed
        >
          <input
            className="input"
            type="text"
            id={id}
            name={name}
            placeholder={selectedOption || placeholder || "Select an option"}
            required={required}
            readOnly // Make the input read-only for dropdown
            onClick={() => setIsDropdownOpen(prev => !prev)} // Toggle dropdown visibility
          />
          <FontAwesomeIcon
            icon={faChevronDown}
            className="dropdown-toggle-icon"
            onClick={() => setIsDropdownOpen(prev => !prev)} // Toggle dropdown visibility
          />
          {isDropdownOpen && (
            <ul className="dropdown-options">
              {options.map((option, index) => (
                <li
                  key={index}
                  className="dropdown-option"
                  onClick={() => {
                    setSelectedOption(option.label); // Set selected option to the label
                    setIsDropdownOpen(false); // Close dropdown
                  }}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Render regular input
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
        defaultValue={defaultValue} // Set default value for regular input
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