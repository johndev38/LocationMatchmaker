import React from "react";

const ProfileTab = () => {
  return (
    <div style={{ padding: "20px", borderBottom: "1px solid #ddd" }}>
      <h3 style={{ fontSize: "1.5rem", color: "#484848" }}>Profil</h3>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        <li style={{ padding: "10px 0", cursor: "pointer", color: "#FF385C" }}>
          Mes informations
        </li>
        {/* Ajoutez d'autres éléments de menu ici si nécessaire */}
      </ul>
    </div>
  );
};

export default ProfileTab; 