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


  return (
    <div>
      <h1>Friends</h1>
      <ul>
        {friends.map((friend, index) => (
          <li key={index}>{friend.username}</li>
        ))}
      </ul>

      <hr></hr>

      <h1>Friend Recommendations</h1>
      <ul>
        {friendRecommendationNames.map((recommendation, index) => (
          <li key={index}>{recommendation.username}</li>
        ))}
      </ul>
    </div>
  );
}

export default Friends;
