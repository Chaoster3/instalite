import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import ChangeTag from "./ChangeTag";
import ChangePassword from "./ChangePassword.jsx";
import ChangeEmail from "./ChangeEmail";
import Home from "./Home";
import "./App.css";
import axios from "axios";

axios.defaults.withCredentials = true;

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await axios.get(`http://localhost:3000/users/checkIfLoggedIn`,);
  //       if (response.status === 200) {
  //         console.log("signed in")
  //         setIsSignedIn(true);
  //       } else {
  //         console.log("not signed in")
  //         setIsSignedIn(false);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching user status:", error);
  //       setIsSignedIn(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/login"
          element={
            isSignedIn ? <Navigate to="/" /> : <Login />
          }
        />
        <Route path="/" element={<Navbar />} />
        <Route path="/home" element={<Home />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/resetPassword/:token" element={<ResetPassword/>} />
        <Route path="/changeEmail" element={<ChangeEmail />} />
        <Route path="/changePassword" element={<ChangePassword />} />
        <Route path="/changeTag" element={<ChangeTag />} />
      </Routes>
    </Router>
  );
}

export default App;
