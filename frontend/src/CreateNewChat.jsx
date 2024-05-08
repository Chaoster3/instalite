import React, { useState } from 'react';

const CreateNewChat = ({ socket, userId, onClose, chatId }) => {
    const [friendUsername, setFriendUsername] = useState("");

    const handleCreateChat = () => {
        if (!friendUsername.trim()) {
            alert("Please enter your friend's username.");
            return;
        }

        socket.emit('createChat', { chatName: "New Chat", user_ids: [userId] });

        socket.emit('sendInvite', {
            inviteeUsername: friendUsername,
            session_id: -1,
            inviterId: userId
        });
        setFriendUsername("");  // Reset input field
        onClose();
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Friend's username"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
            />
            <button onClick={handleCreateChat}>Create Chat</button>
            <button onClick={onClose}>Cancel</button>

        </div>
    );
};

export default CreateNewChat;
