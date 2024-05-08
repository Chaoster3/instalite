import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from 'react-router-dom';
import Post from "./Post";

axios.defaults.withCredentials = true

const Home = () => {
  // Display the current logged in user's name
  const [user, setUser] = useState("");
  const [posts, setPosts] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/checkIfLoggedIn`, { withCredentials: true });
        if (response.status === 200) {
          setUser(response.data.data);
        } else {
          setUser("");
          navigate('/login');
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser("");
        navigate('/login');
      }
    }

    fetchUser();
  }, []);

  // Get the posts the user should see
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/getPostsMainPage`);
        if (response.status === 200) {
          console.log(response.data.posts);
          setPosts(response.data.posts);
        } else {
          setPosts([])
          console.error("Error fetching posts");
        }
      } catch (error) {
        setPosts([]);
        console.error("Error fetching posts:", error);
      }
    }

    fetchPosts();
  }, []);

  return (
    <div>
      <h1>Welcome, {user}!</h1>
      <ul>
        {/* Render posts */}
        {posts.map((post, index) => (
          <Post key={index} post={post} />
        ))}
      </ul>
    </div>
  );

}

export default Home