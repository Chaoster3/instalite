import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import "./App.css";
import axios from "axios";

axios.defaults.withCredentials = true;

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const toggleSignIn = () => {
    setIsSignedIn((prevIsSignedIn) => !prevIsSignedIn);
  };

  // axios.defaults.withCredentials = true;
  useEffect(() => {
    console.log("rerendering app");

    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/users/checkIfLoggedIn`,);
        if (response.status === 200) {
          setIsSignedIn(true);
        } else {
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
        setIsSignedIn(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup onSignIn={toggleSignIn} />} />
        <Route
          path="/"
          element={
            isSignedIn ? <Navbar /> : <Login onSignIn={toggleSignIn} />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
