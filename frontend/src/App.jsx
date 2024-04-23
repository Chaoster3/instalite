import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Landing from "./Landing";
import Signup from "./Signup";
import "./App.css";

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const toggleSignIn = () => {
    setIsSignedIn((prevIsSignedIn) => !prevIsSignedIn);
  };

  useEffect(() => {
    //TODO: Query backend/local storage to set isSignedIn
    setIsSignedIn(false);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup onSignIn={toggleSignIn} />} />
        <Route
          path="/"
          element={
            isSignedIn ? <Navbar /> : <Landing onSignIn={toggleSignIn} />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
