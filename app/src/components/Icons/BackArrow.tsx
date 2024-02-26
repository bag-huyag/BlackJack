import React from "react";

export const BackArrow = () => (
  <div
    style={{
      position: "absolute",
      top: "20px",
      left: "20px",
      cursor: "pointer",
      maxWidth: "100px",
      maxHeight: "100px",
    }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 131 131"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="65.5"
        cy="65.5"
        r="57.5"
        fill="white"
        stroke="#F4F7FC"
        stroke-width="16"
      />
      <path
        d="M73.5 39L47 65.5L73.5 92"
        stroke="#0D4CD3"
        stroke-width="8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
);
