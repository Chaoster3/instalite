import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [newConfirmedPassword, setNewConfirmedPassword] = useState('');

  const handleChangePassword = async () => {
    try {
      const response = await axios.put(`${BACKEND_URL}/users/changePassword`, {
        newPassword: newPassword,
        confirmPassword: newConfirmedPassword,
      });

      if (response.status === 200) {
        console.log("Successfully changed password");
        setNewPassword('');
        setNewConfirmedPassword('');
        navigate("/");
      } else {
        console.error("Error changing password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-96 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl mb-4">Change Password</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleChangePassword();
        }}>
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1"
          />
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={newConfirmedPassword}
            onChange={(e) => setNewConfirmedPassword(e.target.value)}
            required
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1"
          />
          <button
            type="submit"
            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
