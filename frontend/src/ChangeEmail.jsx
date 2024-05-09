import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const ChangeEmail = () => {
  const navigate = useNavigate();

  const [newEmail, setNewEmail] = useState('');

  const handleChangeEmail = async () => {
    try {
      const response = await axios.put(`${BACKEND_URL}/users/changeEmail`, {
        email: newEmail
      });

      if (response.status === 200) {
        console.log("Successfully changed email");
        setNewEmail('');
        navigate("/");
      } else {
        console.error("Error changing email");
      }
    } catch (error) {
      console.error("Error changing email:", error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-96 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl mb-4">Change Email</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleChangeEmail();
        }}>
          <label htmlFor="newEmail">New Email:</label>
          <input
            type="email"
            id="newEmail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
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

export default ChangeEmail;
