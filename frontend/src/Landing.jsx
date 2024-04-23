import React, { useState } from "react";
import { Link } from "react-router-dom"; // Assuming you're using React Router for navigation

function Landing({ onSignIn }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Make POST request to /login to authenticate the user
    console.log("Log In clicked");
    onSignIn();
  };

  const formFields = [
    { name: "username", placeholder: "Username", type: "text" },
    { name: "password", placeholder: "Password", type: "password" },
  ];

  return (
    <div className="landing-container">
      <h1>Welcome to Myelin Oligodendrocyte Glycoprotein</h1>
      <p>Please sign in to continue.</p>
      <form onSubmit={handleLogin}>
        {formFields.map((field, index) => (
          <input
            key={index}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={handleChange}
            required
          />
        ))}
        <button type="submit">Log In</button>
      </form>
      <p>
        Need to sign up?{" "}
        <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
}

export default Landing;
