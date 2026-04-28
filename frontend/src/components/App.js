import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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
  const [isAuth, setIsAuth] = useState(false);
  const [database, setDatabase] = useState({});

  return (
    <Routes>

      {/* 🔐 AUTH ROUTES */}
      <Route path="/" element={<Login setIsAuth={setIsAuth} />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* 🔒 PROTECTED DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          isAuth ? (
            <Dashboard database={database} setDatabase={setDatabase} setIsAuth={setIsAuth} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

    </Routes>
  );
}

export default App;