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
  const [trendingPosts, setTrendingPosts] = useState([]);

  const navigate = useNavigate();

  // Check to see if the user is logged in
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

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        // Fetch the trending posts
        const response = await axios.get(`${BACKEND_URL}/posts/trendingPosts`);
        if (response.status === 200) {
          setTrendingPosts(response.data);

          // Remove trending posts from the normal posts
          const trendingPostIds = trendingPosts.map(post => post.post_id);
          const normalPosts = posts.filter(post => !trendingPostIds.includes(post.post_id));

          setPosts(normalPosts);
        } else {
          setTrendingPosts([]);
          console.error("Error fetching trending posts");
        }
      } catch (error) {
        setTrendingPosts([]);
        console.error("Error fetching trending posts:", error);
      }
    }

    fetchTrendingPosts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user}!</h1>
      <div className="overflow-y-scroll max-h-screen">
        <div className="grid grid-cols-1 gap-6">
          <h1>Trending Posts</h1>
          {trendingPosts.map((post, index) => (
            <Post key={index} post={post} />
          ))}
          <h1>Your Feed</h1>
          {posts.map((post, index) => (
            <Post key={index} post={post} />
          ))}
        </div>
      </div>
    </div>
  );


}

export default Home