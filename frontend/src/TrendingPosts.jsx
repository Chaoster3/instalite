import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import Post from "./Post";


const TrendingPosts = () => {
  const [trendingPosts, setTrendingPosts] = useState([]);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        // Fetch the trending posts
        const response = await axios.get(`${BACKEND_URL}/posts/trendingPosts`);
        if (response.status === 200) {
          setTrendingPosts(response.data);
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
    <div>
      <h1>Trending Posts</h1>
      {trendingPosts.map((post, index) => (
        <Post key={index} post={post} />
      ))}
    </div>
  )
}

export default TrendingPosts