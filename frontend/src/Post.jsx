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
        // const commentContent = response.data.map(comment => comment.content);
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
    <div className="border rounded-md p-2 mb-2">
      <li>
        <h1>Post</h1>
        <h2>Author: {post.username}</h2>
        {/* <p>Content: {post.content}</p> */}
        <p>Content: <span dangerouslySetInnerHTML={{ __html: post.content }} /></p>
        {post.hashtag_names.length > 0 && (
          <li>hashtag: {post.hashtag_names.join(', ')}</li>
        )}

        {/* Like or unlike button */}
        {likedPost ? (
          <button onClick={() => handleUnlikePost(post.post_id)}>Unlike</button>
        ) : (
          <button onClick={() => handleLikePost(post.post_id)}>Like</button>
        )}

        {/* Comments */}
        <hr></hr>
        <h1>Comments</h1>
        <ul>
          {existingComments.map((obj, index) => (
            <li key={index} style={{ marginBottom: '20px' }}>
              <p>Content: {obj.content}</p>
              <p>Author: {obj.author}</p>
              {obj.hashtag_ids && (
                <li>hashtag: {obj.hashtag_ids.join(', ')}</li>
              )}
              <p>Timestamp: {obj.timestamp}</p>
            </li>
          ))}
        </ul>

        <hr></hr>
        <h1>Post a Comment?</h1>
        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)}/>
      </li>
      <HashTagsSelector handleSubmit={handleCommentSubmit} doneButtonText="Create Comment" finalHashtagNames={commentHashtagNames} setFinalHashtagNames={setCommentHashtagNames} />
    </div>
  )
}

export default Post