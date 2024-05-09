import { useEffect, useState } from "react";
import { BACKEND_URL } from "./utils/constants";
import axios from 'axios';

export function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [username, setUsername] = useState("");
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

  const getRequests = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/users/getFriendRequests`);
      setRequests(response.data);
    } catch (error) {
      setRequests([]);
      console.error('Error fetching friend requests:', error);
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
    getRequests();
    getFriendRecommendations();

    // Recompute friend recommendations daily
    const intervalId = setInterval(() => {
      getFriendRecommendations();
    }, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const sendRequest = async (recipient_username) => {
    try {
      const body = { recipient_username };
      await axios.post(`${BACKEND_URL}/users/sendFriendRequest`, body);
      alert('Friend request sent');
    } catch (error) {
      if (error) {
        alert(error.response.data.error);
      }
    }
  }

  const handleChange = (e) => {
    setUsername(e.target.value);
  };

  const accept = async (sender_username) => {
    const body = { sender_username };
    await axios.post(`${BACKEND_URL}/users/acceptRequest`, body);
    getRequests();
  };

  const decline = async (sender_username) => {
    const body = { sender_username };
    await axios.post(`${BACKEND_URL}/users/declineRequest`, body);
    getRequests();
  };


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
      await axios.post(`${BACKEND_URL}/users/removeFriend/`, {friendId});
      getFriends();
      getFriendRecommendations();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };


  return (
    <div className="container mx-auto p-8 flex flex-col">
      <h1 className="text-3xl font-bold mb-4">Friends</h1>
      <div className="mb-4">
        <label className="flex items-center shadow-lg p-4 rounded-lg bg-white">
          <span className="mr-2 font-semibold">Send a friend request:</span>
          <input
            className="border border-gray-300 px-2 py-1 rounded-md flex-grow"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          <button className="ml-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md" onClick={() => sendRequest(username)}>Submit</button>
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="mb-4 shadow-lg p-4 rounded-lg bg-white">
          <h2 className="text-lg font-bold mb-2">Friend Requests Received</h2>
          <ul>
            {requests.map((request, index) => (
              <li key={index} className="flex items-center justify-between mb-2 p-2 rounded-md shadow-sm bg-gray-100">
                <span className="ml-3">{request.username}</span>
                <div>
                  <button className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md mr-2" onClick={() => accept(request.username)}>Accept</button>
                  <button className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md" onClick={() => decline(request.username)}>Decline</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-4 shadow-lg p-4 rounded-lg bg-white">
          <h2 className="text-lg font-bold">Current Friends</h2>
          <ul className="list-none p-0">
            {friends.map((friend, index) => (
              <li key={index} className="flex items-center justify-between mb-2 mt-2 rounded-md shadow-sm bg-gray-100">
                <span className="ml-5">{friend.username}</span>
                <span className={`text-${friend.logged_in === 0 ? 'red' : 'green'}-500 ml-4`}>{friend.logged_in === 0 ? "Inactive" : "Active"}</span>
                <button className="bg-red-500 hover:bg-red-600 text-white rounded-md px-2 py-0" onClick={() => removeFriend(friend.user_id)}>X</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mb-4 shadow-lg p-4 rounded-lg bg-white">
          <h2 className="text-lg font-bold mb-4">Friend Recommendations</h2>
          <ul>
            {friendRecommendationNames.map((recommendation, index) => (
              <li key={index} className="flex items-center justify-between mb-2 p-2 rounded-md shadow-sm bg-gray-100">
                <span>{recommendation.username}</span>
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md" onClick={() => addFriend(recommendation.user_id)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Friends;