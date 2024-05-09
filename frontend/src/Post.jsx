import { useState, useEffect } from "react";
import { BACKEND_URL } from "./utils/constants";
import axios from "axios";
import HashTagsSelector from "./HashTagsSelector";

const Post = ({ post }) => {
  const [likedPost, setLikedPost] = useState(false);
  const [existingComments, setExistingComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentHashtagNames, setCommentHashtagNames] = useState([]);

  const handleUnlikePost = async (postId) => {
    try {
      await axios.get(`${BACKEND_URL}/users/unlikePost/${postId}`, { withCredentials: true });
      setLikedPost(false);
      console.log("Post unliked successfully");
    } catch (error) {
      console.error('Error unliking the post:', error);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/users/likePost/${postId}`, { withCredentials: true });
      if (response.status === 200) {
        setLikedPost(true);
        console.log("Post liked successfully");
      } else {
        console.error("Error liking post");
        setLikedPost(false)
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  useEffect(() => {
    const checkIfLikedPost = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/checkIfLikedPost/${post.post_id}`, { withCredentials: true });
        console.log(post.image_url);
        setLikedPost(response.status === 200);
      } catch (error) {
        console.error('Error fetching liked posts:', error);
      }
    };
    checkIfLikedPost();
  }, []);

  const handleCommentSubmit = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/comments/createComment/${post.post_id}`, {
        content: commentText,
        hashtag_names: commentHashtagNames
      });
      if (response.status === 200) {
        console.log("Comment added successfully");
        setCommentText("");
        setCommentHashtagNames([]);
        getPostComments();
      } else {
        console.error("Error submitting comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const getPostComments = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/comments/getComment/${post.post_id}`, { withCredentials: true });
      if (response.status === 200) {
        setExistingComments(response.data);
      } else {
        console.error("Error fetching comments");
        setExistingComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setExistingComments([]);
    }
  };

  useEffect(() => {
    getPostComments();
  }, []);

  return (
    <div className="border rounded-md p-4 mb-4 shadow-md bg-white">
      <div>
        <p className="text-gray-600 mb-2 text-left"> {post.username}</p>
        <p className="mb-4">Content: <span className="whitespace-pre-line">{post.content} </span></p>
        {post.image_url && (
          <img src={post.image_url}/>
        )}
        {post.hashtag_names.length > 0 && (
          <p className="text-gray-600 mb-2">Hashtags: {post.hashtag_names.join(', ')}</p>
        )}
        <button className={`text-sm font-semibold py-1 px-3 ${likedPost ? 'bg-red-500' : 'bg-blue-500'} text-white rounded-md hover:bg-opacity-75`} onClick={() => likedPost ? handleUnlikePost(post.post_id) : handleLikePost(post.post_id)}>
          {likedPost ? 'Unlike' : 'Like'}
        </button>
      </div>
      <hr className="my-6" />
      <div>
        <h2 className="text-xl font-semibold mb-2">Comments</h2>
        <ul>
          {existingComments.map((comment, index) => (
            <li key={index} className="border rounded-md p-3 mb-4">
              <p className="text-gray-600 mb-2">Content: {comment.content}</p>
              <p className="text-gray-600 mb-2">Author: {comment.author}</p>
              {comment.hashtag_ids && (
                <p className="text-gray-600 mb-2">Hashtags: {comment.hashtag_ids.join(', ')}</p>
              )}
              <p className="text-gray-600">Timestamp: {comment.timestamp}</p>
            </li>
          ))}
        </ul>
        <div className="border rounded-md p-3 mb-4">
          <h2 className="text-xl font-semibold mb-2">Post a Comment</h2>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment"
            className="border rounded-md p-2 w-full mb-2"
          />
        </div>
      </div>
    </div>
  );

};

export default Post;