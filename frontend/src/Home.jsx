import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";

const Home = () => {
  // Display the current logged in user's name
  const [user, setUser] = useState("");
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/checkIfLoggedIn`);
        setUser(response.data.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }

    fetchUser();
  }, []);


  return (
    <div>
      <h1>Welcome, {user}!</h1>
    </div>
  )

}

export default Home