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
  // const [userLikedPostIds, setUserLikedPostIds] = useState([]);
  // const [commentText, setCommentText] = useState("");
  // const [commentHashtagNames, setCommentHashtagNames] = useState([]);
  // const [getComments, setGetComments] = useState([]);

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

  // const handleLikePost = async (postId) => {
  //   try {
  //     const response = await axios.get(
  //       `${BACKEND_URL}/users/likePost/${postId}`,
  //       { withCredentials: true }
  //     );
  //     if (response.status === 200) {
  //       setUserLikedPostIds([...userLikedPostIds, postId]);
  //       console.log("Post liked successfully");
  //     } else {
  //       console.error("Error liking post");
  //     }
  //   } catch (error) {
  //     console.error("Error liking post:", error);
  //   }
  // }

  // useEffect(() => {
  //   fetchUserLikedPosts();
  // }, []);

  // const fetchUserLikedPosts = async () => {
  //   try {
  //     const response = await axios.get(
  //       `${BACKEND_URL}/users/getLikedPosts`,
  //       { withCredentials: true }
  //     );

  //     const post_ids = response.data.posts.map(post => post.post_id);
  //     setUserLikedPostIds(post_ids);
  //   } catch (error) {
  //     console.error('Error fetching liked posts:', error);
  //   }
  // };

  // const handleUnlikePost = async (postId) => {
  //   try {
  //     // Send a request to unlike the post
  //     await axios.get(
  //       `${BACKEND_URL}/users/unlikePost/${postId}`,
  //       { withCredentials: true }
  //     );
  //     // Update the list of liked posts in the component state
  //     setUserLikedPostIds(userLikedPostIds.filter(id => id !== postId));
  //   } catch (error) {
  //     console.error('Error unliking the post:', error);
  //   }
  // };


  // Create a new comments
  // const handleCommentSubmit = async (postId) => {
  //   try {
  //     // Send a request to add the comment
  //     await axios.post(`${BACKEND_URL}/comments/createComment/${postId}`, {
  //       content: commentText,
  //       hashtag_names: commentHashtagNames
  //     });

  //     setCommentText("");
  //     setCommentHashtagNames([])
  //   } catch (error) {
  //     console.error("Error submitting comment:", error);
  //     setCommentText("");
  //     setCommentHashtagNames([])
  //   }
  // };


  // return (
  //   <div>
  //     <h1>Welcome, {user}!</h1>
  //     <h2>Posts</h2>
  //     <ul>
  //       {/* Render posts */}
  //       {posts.map((post, index) => (
  //         <div key={index} className="border rounded-md p-2 mb-2">
  //           <li>author: {post.username}</li>
  //           <li>content: {post.content}</li>
  //           {post.hashtag_names.length > 0 && (
  //             <li>hashtag: {post.hashtag_names.join(', ')}</li>
  //           )}

  //           {/* Render like/unlike button based on whether the post is liked */}
  //           {/* {userLikedPostIds.includes(post.post_id) ? (
  //             <button onClick={() => handleUnlikePost(post.post_id)}>Unlike</button>
  //           ) : (
  //             <button onClick={() => handleLikePost(post.post_id)}>Like</button>
  //           )} */}


  //           {/* Get and display comments for the post */}
  //           {/* <h1>Comments</h1> */}
  //           {/* <ul>
  //             {getPostComments(post.post_id).map((comment, commentIndex) => (
  //               <li key={commentIndex}>{comment}</li>
  //             ))}
  //           </ul> */}

  //           {/* Input field for typing comments */}

  //           {/* <hr></hr>
  //           <h2>Post a Comment?</h2>
  //           <input
  //             type="text"
  //             value={commentText}
  //             onChange={(e) => setCommentText(e.target.value)}
  //           />
  //           {/* Button to submit the comment */}
  //           {/* <button onClick={() => handleCommentSubmit(post.post_id)}>
  //             Submit Comment
  //           </button> */}
  //         </div>
  //       ))}
  //     </ul>
  //   </div>
  // );
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