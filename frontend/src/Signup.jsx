import React, { useState } from "react";
import { Link } from "react-router-dom"; // Assuming you're using React Router for navigation

function Signup({ onSignIn }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    affiliation: "",
    birthday: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSignup = (e) => {
    e.preventDefault();
    //TODO: make POST request to /register to sign up
    console.log("Sign Up clicked");
    onSignIn();
  };

  const formFields = [
    { name: "username", placeholder: "Username", type: "text" },
    { name: "password", placeholder: "Password", type: "password" },
    { name: "firstName", placeholder: "First Name", type: "text" },
    { name: "lastName", placeholder: "Last Name", type: "text" },
    { name: "email", placeholder: "Email", type: "email" },
    { name: "affiliation", placeholder: "Affiliation", type: "text" },
    { name: "birthday", placeholder: "Birthday", type: "date" },
  ];

  return (
    <div className="landing-container">
      <h1>Welcome to Myelin Oligodendrocyte Glycoprotein</h1>
      <p>Please sign up to continue.</p>
      <form onSubmit={handleSignup}>
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
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account?{" "}
        <Link to="/#">Log In</Link>
      </p>
    </div>
  );
}

export default Signup;
