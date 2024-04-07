import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "../Icons/EyeIcons";
import "./Input.css";

interface InputProps {
  name: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  show?: boolean;
  type: "text" | "password" | "email";
}

export function Input({
  name,
  id,
  value,
  onChange = () => {},
  placeholder = "",
}: InputProps) {
  return (
    <input
      id={id}
      className="input"
      type="text"
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

export function InputPassword({
  name,
  id,
  value,
  show = false,
  onChange = () => {},
  placeholder = "",
}: InputProps) {
    const [showPassword, setShowPassword] = useState(show);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    }

  return (
    <>
      <div className="input-password">
        <input
          id={id}
          className="input"
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {
        showPassword ? (
            <EyeIcon onClick={toggleShowPassword} className="eye-svg"/>
          ) : (
            <EyeSlashIcon onClick={toggleShowPassword} className="eye-svg"/>
        )}

      </div>
    </>
  );
}
