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
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  useEffect(() => {
    const checkIfLikedPost = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/users/checkIfLikedPost/${post.post_id}`, { withCredentials: true });
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
    <div className="border rounded-md p-4 mb-4">
      <div>
        <h2 className="text-lg font-bold mb-1">Post</h2>
        <p className="mb-2">Author: {post.username}</p>
        <p className="mb-2">Content: <span dangerouslySetInnerHTML={{ __html: post.content }} /></p>
        {post.hashtag_names.length > 0 && (
          <p className="mb-2">Hashtags: {post.hashtag_names.join(', ')}</p>
        )}
        <button className="text-blue-500" onClick={() => likedPost ? handleUnlikePost(post.post_id) : handleLikePost(post.post_id)}>
          {likedPost ? 'Unlike' : 'Like'}
        </button>
      </div>
      <hr className="my-4" />
      <div>
        <h2 className="text-lg font-bold mb-1">Comments</h2>
        <ul>
          {existingComments.map((comment, index) => (
            <li key={index} className="mb-4">
              <p className="mb-1">Content: {comment.content}</p>
              <p className="mb-1">Author: {comment.author}</p>
              {comment.hashtag_ids && (
                <p className="mb-1">Hashtags: {comment.hashtag_ids.join(', ')}</p>
              )}
              <p className="text-gray-500">Timestamp: {comment.timestamp}</p>
            </li>
          ))}
        </ul>
        <hr className="my-4" />
        <div>
          <h2 className="text-lg font-bold mb-1">Post a Comment</h2>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment"
            className="border rounded-md p-2 w-full mb-2"
          />
          <HashTagsSelector
            handleSubmit={handleCommentSubmit}
            doneButtonText="Create Comment"
            finalHashtagNames={commentHashtagNames}
            setFinalHashtagNames={setCommentHashtagNames}
          />
        </div>
      </div>
    </div>
  );
};

export default Post;