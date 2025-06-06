import { faChevronDown, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import "./Input.css"; // Import the CSS file

function Input({
  icon,
  type,
  name,
  id,
  placeholder,
  required,
  style,
  position,
  options = [],
  value = "",
  onChange,
  disabled = false // Add disabled prop with a default value of false
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility
  const dropdownRef = useRef(null); // Ref for the dropdown container

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
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
          className={`custom-dropdown ${position ? (position === "right" ? "icon-right" : "icon-left") : ""} ${
            disabled ? "disabled" : ""
          }`} // Add disabled class if the input is disabled
          style={style} // Allow additional inline styles if needed
        >
          <input
            className="input"
            type="text"
            id={id}
            name={name}
            placeholder={placeholder || "Select an option"}
            required={required}
            readOnly // Make the input read-only for dropdown
            value={options.find((option) => option.value === value)?.label || ""} // Display the selected option
            onClick={() => !disabled && setIsDropdownOpen((prev) => !prev)} // Toggle dropdown visibility if not disabled
            disabled={disabled} // Disable the input if the disabled prop is true
          />
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`dropdown-toggle-icon ${disabled ? "disabled" : ""}`} // Add disabled class if the input is disabled
            onClick={() => !disabled && setIsDropdownOpen((prev) => !prev)} // Toggle dropdown visibility if not disabled
          />
          {isDropdownOpen && !disabled && (
            <ul className="dropdown-options">
              {options.map((option, index) => (
                <li
                  key={index}
                  className={`dropdown-option ${disabled ? "disabled" : ""}`} // Add disabled class if the input is disabled
                  onClick={() => {
                    if (!disabled && onChange) {
                      onChange(option.value); // Trigger onChange with the selected value
                    }
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

  if (type === "datetime") {
    return (
      <div className={`input-container ${position ? (position === "right" ? "icon-right" : "icon-left") : ""}`}>
        {icon && position && <FontAwesomeIcon icon={icon} className="input-icon" />}
        <div className={`datetime-box ${disabled ? "disabled" : ""}`}> {/* Add disabled class if the input is disabled */}
          <input
            type="number"
            name="day"
            placeholder="dd"
            value={value?.day || ""}
            onChange={(e) => {
              if (!disabled) {
                const rawValue = e.target.value;
                const value = rawValue === "" ? "" : Math.max(1, Math.min(31, parseInt(rawValue) || 0));
                onChange({ ...value, day: value });
              }
            }}
            min="1"
            max="31"
            className="datetime-segment"
            required={required}
            disabled={disabled} // Disable the input if the disabled prop is true
          />
          /
          <input
            type="number"
            name="month"
            placeholder="mm"
            value={value?.month || ""}
            onChange={(e) => {
              if (!disabled) {
                const rawValue = e.target.value;
                const value = rawValue === "" ? "" : Math.max(1, Math.min(12, parseInt(rawValue) || 0));
                onChange({ ...value, month: value });
              }
            }}
            min="1"
            max="12"
            className="datetime-segment"
            required={required}
            disabled={disabled} // Disable the input if the disabled prop is true
          />
          /
          <input
            type="number"
            name="year"
            placeholder="yyyy"
            value={value?.year || ""}
            onChange={(e) => {
              if (!disabled) {
                const rawValue = e.target.value;
                const value = rawValue === "" ? "" : Math.max(0, Math.min(2100, parseInt(rawValue) || 0));
                onChange({ ...value, year: value });
              }
            }}
            min="1"
            max="2100"
            className="datetime-segment"
            required={required}
            disabled={disabled} // Disable the input if the disabled prop is true
          />
                    <div className="time-group">
            <input
              type="number"
              name="hour"
              placeholder="hh"
              value={value?.hour === 0 ? "0" : value?.hour || ""} // Show "0" if the value is 0
              onChange={(e) => {
                if (!disabled) {
                  const rawValue = e.target.value;
                  const parsedValue = rawValue === "" ? "" : Math.max(0, Math.min(23, parseInt(rawValue) || 0));
                  onChange({ ...value, hour: parsedValue }); // Allow 0 as a valid value
                }
              }}
              min="0"
              max="23"
              className="datetime-segment"
              required={required}
              disabled={disabled} // Disable the input if the disabled prop is true
            />
            :
            <input
              type="number"
              name="minute"
              placeholder="mm"
              value={value?.minute === 0 ? "0" : value?.minute || ""} // Show "0" if the value is 0
              onChange={(e) => {
                if (!disabled) {
                  const rawValue = e.target.value;
                  const parsedValue = rawValue === "" ? "" : Math.max(0, Math.min(59, parseInt(rawValue) || 0));
                  onChange({ ...value, minute: parsedValue }); // Allow 0 as a valid value
                }
              }}
              min="0"
              max="59"
              className="datetime-segment"
              required={required}
              disabled={disabled} // Disable the input if the disabled prop is true
            />
          </div>
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
        value={value} // Set default value for regular input
        onChange={onChange} // Trigger onChange when input value changes
        autoComplete="off" // Disable autofill
        disabled={disabled} // Disable the input if the disabled prop is true
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