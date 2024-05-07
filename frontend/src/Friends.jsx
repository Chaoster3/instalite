import { useEffect, useState } from "react";
import { BACKEND_URL } from "./utils/constants";
import axios from 'axios';

export function Friends() {
  const [friends, setFriends] = useState([]);
  const [friendRecommendationNames, setFriendRecommendationNames] = useState([]);

  // Get the list of friends from the backend
  const getFriends = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/users/getAllFriends`);
      setFriends(response.data.friends);
    } catch (error) {
      setFriends([]);
      console.error('Error fetching friends:', error);
    }
  };

  const getFriendRecommendations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/users/getFriendRecommendation`);
      setFriendRecommendationNames(response.data.friendRecommendation);
    } catch (error) {
      setFriendRecommendationNames([]);
      console.error('Error fetching friend recommendations:', error);
    }
  }

  useEffect(() => {
    getFriends();
    getFriendRecommendations();

    // Recompute friend recommendations daily
    const intervalId = setInterval(() => {
      getFriendRecommendations();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);


  // Function to add a friend
  const addFriend = async (friendId) => {
    console.log("Trying to add friend with id", friendId)
    try {
      await axios.post(`${BACKEND_URL}/users/addFriend/${friendId}`);
      getFriends();
      getFriendRecommendations();
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  // Function to remove a friend
  const removeFriend = async (friendId) => {
    console.log("Trying to remove friend with id", friendId)
    try {
      await axios.post(`${BACKEND_URL}/users/removeFriend/${friendId}`);
      getFriends();
      getFriendRecommendations();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  return (
    <div>
      <h1>Friends</h1>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {friends.map((friend, index) => (
            <li key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
              <span style={{ marginRight: '10px' }}>{friend.username}</span>
              <span style={{ color: friend.logged_in === 0 ? 'red' : 'green' }}>{friend.logged_in === 0 ? "Inactive" : "Active"}</span>
              <button style={{ marginLeft: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }} onClick={() => removeFriend(friend.user_id)}>Remove</button>
            </li>
          ))}
        </ul>

      <hr></hr>

      <h1>Friend Recommendations</h1>
      <ul>
        {friendRecommendationNames.map((recommendation, index) => (
          <li key={index}>
            {recommendation.username}
            <button onClick={() => addFriend(recommendation.user_id)}>Add</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Friends;
