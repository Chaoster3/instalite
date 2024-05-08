import { useState, useEffect } from "react";
import { BACKEND_URL } from "./utils/constants";
import axios from "axios";
import HashTagsSelector from "./HashTagsSelector";


const Post = ({ post }) => {
  const [likedPost, setLikedPost] = useState(false);
  const [existingComments, setExistingComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentHashtagNames, setCommentHashtagNames] = useState([]);

  // Sends a backend request to unlike a post
  const handleUnlikePost = async (postId) => {
    try {
      // Send a request to unlike the post
      await axios.get(
        `${BACKEND_URL}/users/unlikePost/${postId}`,
        { withCredentials: true }
      );

      console.log("Post unliked successfully")
      setLikedPost(false);
    } catch (error) {
      console.error('Error unliking the post:', error);
    }
  };

  // Sends a backend request to like a post
  const handleLikePost = async (postId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/users/likePost/${postId}`,
        { withCredentials: true }
      );
      if (response.status === 200) {
        setLikedPost(true);
        console.log("Post liked successfully");
      } else {
        setLikedPost(false);
        console.error("Error liking post");
      }
    } catch (error) {
      setLikedPost(false);
      console.error("Error liking post:", error);
    }
  }

  // Checks if the user already liked the post
  useEffect(() => {
    const checkIfLikedPost = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/users/checkIfLikedPost/${post.post_id}`,
          { withCredentials: true }
        );

        if (response.status === 200) {
          setLikedPost(true);
        } else {
          console.error("Error fetching liked posts");
          setLikedPost(false);
        }
      } catch (error) {
        console.error('Error fetching liked posts:', error);
        setLikedPost(false);
      }
    };

    checkIfLikedPost();
  }, []);

  // Submitting the comment
  const handleCommentSubmit = async () => {
    try {
      // Send a request to add the comment
      const response = await axios.post(`${BACKEND_URL}/comments/createComment/${post.post_id}`, {
        content: commentText,
        hashtag_names: commentHashtagNames
      });

      setCommentText("");
      setCommentHashtagNames([])
      if (response.status === 200) {
        console.log("Comment added successfully");
        getPostComments();
      }
      else {
        console.error("Error submitting comment");
      }

    } catch (error) {
      console.error("Error submitting comment:", error);
      setCommentText("");
      setCommentHashtagNames([])
    }
  };

  const getPostComments = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/comments/getComment/${post.post_id}`,
        { withCredentials: true }
      );
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
  }

  useEffect(() => {
    getPostComments();
  }, []);

  return (
    <div className="border rounded-md p-4 mb-4">
      <div className="mb-4">
        <div className="mb-2">
          <h2 className="text-lg font-medium">Author: {post.username}</h2>
          <p className="mb-2">Content: <span dangerouslySetInnerHTML={{ __html: post.content }} /></p>
          {post.hashtag_names.length > 0 && (
            <p className="mb-2">Hashtags: {post.hashtag_names.join(', ')}</p>
          )}
        </div>
        <div className="mb-4">
          {/* Like or unlike button */}
          <button
            className={`px-4 py-2 rounded-md font-medium ${likedPost ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
            onClick={() => likedPost ? handleUnlikePost(post.post_id) : handleLikePost(post.post_id)}
          >
            {likedPost ? 'Unlike' : 'Like'}
          </button>
        </div>
      </div>

      {/* Comments */}
      <hr className="my-4" />
      <div className="mb-4">
        <h1 className="text-xl font-semibold mb-2">Comments</h1>
        <ul>
          {existingComments.map((obj, index) => (
            <li key={index} className="mb-6">
              <div className="border border-gray-300 rounded-md p-4">
                <p className="mb-2">Content: {obj.content}</p>
                <p className="mb-2">Author: {obj.author}</p>
                {obj.hashtag_ids && (
                  <p className="mb-2">Hashtags: {obj.hashtag_ids.join(', ')}</p>
                )}
                <p className="text-gray-500">Timestamp: {obj.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Post a Comment */}
      <hr className="my-4" />
      <div>
        <h1 className="text-xl font-semibold mb-2">Post a Comment</h1>
        <input
          type="text"
          className="border border-gray-300 rounded-md px-3 py-2 mb-2"
          placeholder="Enter your comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <HashTagsSelector
          handleSubmit={handleCommentSubmit}
          doneButtonText="Create Comment"
          finalHashtagNames={commentHashtagNames}
          setFinalHashtagNames={setCommentHashtagNames}
        />
      </div>
    </div>
  )

}

export default Post