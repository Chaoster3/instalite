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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Friends</h1>
        <ul className="divide-y divide-gray-300">
          {friends.map((friend, index) => (
            <li key={index} className="py-4 flex items-center justify-between">
              <div>
                <span className="mr-4">{friend.username}</span>
                <span className={`text-sm font-medium ${friend.logged_in === 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {friend.logged_in === 0 ? 'Inactive' : 'Active'}
                </span>
              </div>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
                onClick={() => removeFriend(friend.user_id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <hr className="my-8" />

      <div>
        <h1 className="text-3xl font-bold mb-4">Friend Recommendations</h1>
        <ul className="divide-y divide-gray-300">
          {friendRecommendationNames.map((recommendation, index) => (
            <li key={index} className="py-4 flex items-center justify-between">
              <span>{recommendation.username}</span>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:bg-green-600"
                onClick={() => addFriend(recommendation.user_id)}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Friends;
