function Navbar({ setSection, setIsAuth }) {
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout? Any unsaved progress may be lost.");
    if (confirmLogout) {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userData");
      setIsAuth(false);
    }
  };

  return (
    <div className="navbar">
      <button onClick={() => setSection("admin")}>
        <span>📊</span> Admin Dashboard
      </button>

      <button onClick={() => setSection("donor")}>
        <span>🎁</span> Donor Panel
      </button>

      <button onClick={() => setSection("recipient")}>
        <span>🤝</span> Recipient View
      </button>

      <button onClick={() => setSection("logistics")}>
        <span>🚚</span> Logistics Hub
      </button>

      <button onClick={() => setSection("track")}>
        <span>📍</span> Track Status
      </button>

      <button onClick={() => setSection("timetable")}>
        <span>📅</span> Timetable
      </button>

      <button onClick={() => setSection("profile")}>
        <span>👤</span> My Profile
      </button>

      <div style={{ marginTop: "auto", paddingTop: "20px" }}>
        <button 
          onClick={handleLogout}
          style={{ background: "#dc3545" }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;