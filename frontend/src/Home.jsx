import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "./utils/constants";
import { useNavigate } from 'react-router-dom';

axios.defaults.withCredentials = true

const Home = () => {
  // Display the current logged in user's name
  const [user, setUser] = useState("");
  const [posts, setPosts] = useState([]);
  const [userLikedPostIds, setUserLikedPostIds] = useState([]);

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

  const handleLikePost = async (postId) => {
    try {

      console.log(postId);
      const response = await axios.get(
        `${BACKEND_URL}/users/likePost/${postId}`,
        { withCredentials: true }
      );
      if (response.status === 200) {
        setUserLikedPosts([...userLikedPosts, postId]);
        console.log("Post liked successfully");
      } else {
        console.error("Error liking post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  }

  useEffect(() => {
    fetchUserLikedPosts();
  }, []);

  const fetchUserLikedPosts = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/users/likedPosts`,
        { withCredentials: true }
      );


      console.log("fetching usr liked posts", response.data.post_id);
      setUserLikedPostIds(response.data.post_id);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
    }
  };

  const handleUnlikePost = async (postId) => {
    try {
      // Send a request to unlike the post
      await axios.delete(
        `/api/post/${postId}/like`,
        { withCredentials: true }
      );
      // Update the list of liked posts in the component state
      setUserLikedPosts(userLikedPosts.filter(id => id !== postId));
    } catch (error) {
      console.error('Error unliking the post:', error);
    }
  };


  return (
    <div>
      <h1>Welcome, {user}!</h1>
      <h2>Posts</h2>
      <ul>
        {/* Render posts */}
        {posts.map((post, index) => (
          <div key={index} className="border rounded-md p-2 mb-2">
            <li>author: {post.username}</li>
            <li>content: {post.content}</li>
            {post.hashtag_names.map((hashtag, index) => (
              <li key={index}>hashtag: {hashtag}</li>
            ))}
            {/* Render like/unlike button based on whether the post is liked */}
            {/* {userLikedPosts.includes(post.post_id) ? (
              <button onClick={() => handleUnlikePost(post.post_id)}>Unlike</button>
            ) : (
              <button onClick={() => handleLikePost(post.post_id)}>Like</button>
            )} */}
            <button onClick={() => handleLikePost(post.post_id)}>Like</button>
          </div>
        ))}
      </ul>
    </div>
  );
}

export default Home