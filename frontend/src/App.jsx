import { useState, useEffect } from "react";
import { apiUrl } from "./api";

import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import Navbar from "./components/Navbar";
import Admin from "./components/Admin";
import Donor from "./components/Donor";
import Recipient from "./components/Recipient";
import Logistics from "./components/Logistics";
import Track from "./components/Track";
import Timetable from "./components/Timetable";
import Profile from "./components/Profile";

function App() {
  const [isAuth, setIsAuth] = useState(() => Boolean(localStorage.getItem("userEmail")));
  const [showSignup, setShowSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [section, setSection] = useState("admin");

  const [database, setDatabase] = useState({});

  const updateAuth = (nextIsAuth) => {
    if (!nextIsAuth) {
      setDatabase({});
    }
    setIsAuth(nextIsAuth);
  };

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (isAuth && userEmail) {
      // Load from backend for specific user
      fetch(apiUrl(`/api/database?userEmail=${encodeURIComponent(userEmail)}`))
        .then(res => res.json())
        .then(data => setDatabase(data))
        .catch(err => console.error("Error loading database:", err));
    }
  }, [isAuth]);

  // Provide a sync function instead of tracking entire database in useEffect to avoid loops
  const updateDatabase = async (serialId, record) => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return;

    const recordWithUser = { ...record, userEmail };
    setDatabase(prev => ({ ...prev, [serialId]: recordWithUser }));

    try {
      await fetch(apiUrl("/api/database"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialId, data: recordWithUser }),
      });
    } catch (err) {
      console.error("Error saving to database:", err);
    }
  };

  const backgrounds = {
    login: "",
    admin: "",
    donor: "",
    recipient: "",
    logistics: "",
    track: "",
    timetable: "",
    profile: "",
    default: "",
  };

  const currentBackground = !isAuth
    ? backgrounds.login
    : backgrounds[section] || backgrounds.default;

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0f172a" }}>
      {/* 🖼️ FIXED BACKGROUND LAYER */}
      {currentBackground && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: `url(${currentBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: -1,
          }}
        />
      )}

      {/* 🌑 DARK OVERLAY LAYER */}
      {currentBackground && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: -1,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        {!isAuth ? (
          showSignup ? (
            <Signup setShowSignup={setShowSignup} />
          ) : showForgot ? (
            <ForgotPassword setShowForgot={setShowForgot} />
          ) : (
            <Login
              setIsAuth={updateAuth}
              setShowSignup={setShowSignup}
              setShowForgot={setShowForgot}
            />
          )
        ) : (
          <>
            {/* TOP BAR */}
            <div className="top-bar">
              <div className="username">
                Welcome, {localStorage.getItem("currentUser")}
              </div>
            </div>

            {/* DASHBOARD */}
            <div className="main-layout">
              <Navbar
                setSection={setSection}
                setIsAuth={updateAuth}
              />

              {/* ✅ SCROLL ONLY HERE */}
              <div
                className="content-area"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "40px",
                  minHeight: "calc(100vh - 60px)",
                }}
              >
                {section === "admin" && (
                  <Admin database={database} />
                )}

                {section === "donor" && (
                  <Donor updateDatabase={updateDatabase} database={database} />
                )}

                {section === "recipient" && (
                  <Recipient updateDatabase={updateDatabase} database={database} />
                )}

                {section === "logistics" && (
                  <Logistics
                    database={database}
                    updateDatabase={updateDatabase}
                  />
                )}

                {section === "track" && (
                  <Track database={database} />
                )}

                {section === "timetable" && (
                  <Timetable />
                )}

                {section === "profile" && (
                  <Profile />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
