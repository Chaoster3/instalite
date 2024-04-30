import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Login({ onSignIn }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loginStatus, setLoginStatus] = useState("");

  const baseURL = "http://localhost:3000";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${baseURL}/users/login`,
        formData,
      );
      if (response.status === 200) {
        setLoginStatus("Login successful");
        onSignIn();
      }
    } catch (error) {
      setLoginStatus("Login failed");
      setFormData({
        username: "",
        password: "",
      });
    }
  };

  const inputFields = [
    { name: "username", placeholder: "Username", type: "text" },
    { name: "password", placeholder: "Password", type: "password" },
  ];

  return (
    <div className="h-screen w-screen flex justify-center flex-col text-gray-700 w-96 rounded-xl bg-clip-border mx-auto">
      <div className="text-center text-2xl font-bold mb-4">
        Welcome to Myelin Oligodendrocyte Glycoprotein
      </div>
      <div className="flex flex-col gap-4 p-6">
        {inputFields.map((field, index) => (
          <div key={index} className="relative h-11 w-full min-w-[200px]">
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              placeholder=" "
              className="w-full h-full px-3 py-3 font-sans text-sm font-normal transition-all bg-transparent border rounded-md peer border-blue-gray-200 border-t-transparent text-blue-gray-700 outline outline-0 placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-gray-900 focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
            />
            <label className="before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[11px] font-normal leading-tight text-gray-500 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[4.1] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:!border-gray-900 peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:!border-gray-900 peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
              {field.placeholder}
            </label>
          </div>
        ))}
        {loginStatus && <p className={loginStatus.includes('successful') ? 'text-green-500' : 'text-red-500'}>{loginStatus}</p>}
      </div>
      <div className="p-6 pt-0">
        <button
          onClick={handleLogin}
          className="block w-full select-none rounded-lg bg-gradient-to-tr from-gray-900 to-gray-800 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-gray-900/10 transition-all hover:shadow-lg hover:shadow-gray-900/20 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          type="button"
        >
          Sign In
        </button>
        <p className="flex justify-center mt-6 font-sans text-sm antialiased font-light leading-normal text-inherit">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="block ml-1 font-sans text-sm antialiased font-bold leading-normal text-blue-gray-900"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
