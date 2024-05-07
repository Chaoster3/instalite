import { useEffect, useState } from "react";
import { BACKEND_URL } from "./utils/constants";
import axios from 'axios';

export function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [username, setUsername] = useState("");

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
      setFriends([]);
      console.error('Error fetching friends:', error);
    }
  };

  useEffect(() => {
    getFriends();
    getRequests();
  }, []);

  const sendRequest = async (username) => {
    try {
      const body = {username};
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
    const body = {sender_username};
    await axios.post(`${BACKEND_URL}/users/acceptRequest`, body);
  };

  const decline = async (sender_username) => {
    const body = { sender_username };
    await axios.post(`${BACKEND_URL}/users/declineRequest`, body);
  };

  return (
    <div>
      <h1>Friends</h1>
      <div>
        <label>
          Send a friend request:
          <input
            className="ml-2"
            type="text"
            value={username}
            onChange={handleChange}
            placeholder="Enter username"
          />
        </label>
        <button onClick={() => sendRequest(username)}>Submit</button>
      </div>
      <div>
        Friend Requests Received
      </div>
      <ul>
        {requests.map((request, index) => (
          <div key={index}>
            <div>
              {request.username}
            </div>
            <button onClick={() => accept(request.username)}>
              Accept
            </button>
            <button onClick={() => decline(request.username)}>
              Decline
            </button>
          </div>
        ))}
      </ul>
      <div>
        Current Friends
      </div>
      <ul>
        {friends.map((friend, index) => (
          <li key={index}>{friend.username}</li>
        ))}
      </ul>
    </div>
  );
}

export default Friends;
