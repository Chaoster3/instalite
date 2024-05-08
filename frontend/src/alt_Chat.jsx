import React, { useState, useEffect } from 'react'
import io from 'socket.io-client'
import { Avatar, Card, List, ListItem, ListItemSuffix } from "@material-tailwind/react"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import CreateNewChat from './CreateNewChat' 

const socket = io('http://localhost:3005')


const messageComponent = ({ sender, message, avatar }) => {
    return (
        <div
            className={`w-full p-5 flex flex-row ${sender === "self" && "justify-end"
                } space-x-3`}
        >
            <div
                className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === "self" ? "bg-blue-100" : "bg-gray-200"
                    }`}
            >
                {message}
            </div>
            <Avatar src={avatar} color="light-blue" size="lg" className="h-8 w-8" />
        </div>
    );
};

const Chat = () => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState({});
    const [chats, setChats] = useState([]);
    const [chatName, setChatName] = useState("");
    const [editing, setEditing] = useState(false);
    const [showCreateNewChat, setShowCreateNewChat] = useState(false);
    const user_id = 1;

    const handleCreateNewChat = () => {
        setShowCreateNewChat(true); // Open the popup
    };

    const handleCloseNewChat = () => {
        setShowCreateNewChat(false); // Close the popup
    };


    const handleNameChange = (event) => {
        setChatName(event.target.value);
    };

    const submitNewName = () => {
        console.log("RENAMING", chatName);
        if (messages.chatID) {
            socket.emit('renameChat', { chatID: messages.chatID, newName: chatName });
            setEditing(false);
        }
    };

    const editName = () => {
        setEditing(true);
        setChatName(chats.find(chat => chat.chatID === messages.chatID)?.name || "New Chat");
    };

    useEffect(() => {
        socket.on('receiveInvite', ({ sessionId, inviterId }) => {
            console.log(`Invited to join chat by user ${inviterId}`);
            const accept = window.confirm(`Accept invitation to join?`);
            socket.emit('respondToInvite', { sessionId, userId, accept });
        });

        return () => {
            socket.off('receiveInvite');
            socket.off('respondToInvite');
        };
    }, [socket]);


    useEffect(() => {
        socket.on('chatRenamed', ({ chatID, newName }) => {
            if (messages.chatID === chatID) {
                setChatName(newName);
            }
            setChats(currentChats => currentChats.map(chat => {
                if (chat.chatID === chatID) {
                    return { ...chat, name: newName };
                }
                return chat;
            }));
        });

        return () => {
            socket.off('chatRenamed');
        };
    }, [messages.chatID]);



    useEffect(() => {
        console.log('Chats updated:', chats);
    }, [chats]);

    useEffect(() => {

        // socket.emit('loadChats', { userId: req.session.user_id });
        socket.emit('loadChats', { userId: user_id });

        socket.on('historicalMessages', (newChats) => {
            console.log("in historical messages");

            if (newChats != null) {
                setChats(newChats);
            } 
        });

        socket.on('newMessage', (newMessage) => {
            console.log("GOT NEW MESSAGE", newMessage);
            setChats((currentChats) => {
                return currentChats.map((chat) => {
                    if (chat.chatID === newMessage.chatID) {
                        return { ...chat, messages: [...chat.messages, newMessage] };
                    }
                    return chat;
                });
            });
        });

        socket.on('chatLoaded', (chatInfo) => {
            console.log("Received 'chatLoaded' event", chatInfo);
            setChats(currentChats => [
                ...currentChats,
                {
                    name: chatInfo.chatName || "New Chat",
                    chatID: chatInfo.chatID,
                    users: chatInfo.users,
                    messages: chatInfo.messages || []  // Include existing messages or start with an empty array
                }
            ]);
            // Set messages state if this chat is immediately active/viewed
            setMessages({ messages: chatInfo.messages || [], chatID: chatInfo.sessionId });
        });

        socket.on('leftChat', (data) => {
            if (data.success) {
                setChats(currentChats => currentChats.filter(chat => chat.chatID !== data.chatID));
            } else {
                console.error('Failed to leave chat:', data.error);
            }
        });



        return () => {
            socket.off('historicalMessages');
            socket.off('newMessage');
            socket.off('joinRoom');
            socket.off('chatLoaded');
            socket.off('loadChats');
            socket.off('leftChat');
        };
    }, []);

    const sendMessage = (chatID) => {
        if (message) {
            // socket.emit('chatMessage', { chatID, req.session.user_id, message });
            console.log('Sending message:', message);
            socket.emit('chatMessage', { chatID: chatID, userId: user_id, message: message });
            setMessage('');
        }
    };

    const handleKeyDown = (event, chatID) => {
        if (event.key === 'Enter') {
            sendMessage(chatID);
        }
    };

    // const createNewChat = () => {
    //     console.log("HIT Button");
    //     const userIds = [1];
    //     socket.emit('createChat', { chatName: "New Chat", userIds });
    // };


    return (
        <div>
            <div className="flex space-x-5 flex-row">
                <Card className="w-96 flex flex-row justify-end self-start">
                    <List>
                        <ListItem className="self-end w-12 items-center" onClick={handleCreateNewChat}>
                            <ListItemSuffix>
                                {" "}
                                <PencilSquareIcon className="h-6 w-6 text-gray-500" />
                            </ListItemSuffix>

                        </ListItem>
                        {chats.map((chat, key) => (
                            <ListItem
                                key={key}
                                onClick={() => {
                                    setMessages({ messages: chat.messages, chatID: chat.chatID });
                                    setChatName(chat.name || "New Chat");
                                }}
                            >
                                <div className="w-96 flex flex-row items-center gap-2 p-2">
                                    <div className="flex items-center -space-x-4">
                                        {chat.users.map((user, key) => (
                                            <Avatar
                                                key={key}
                                                src={user.avatar}
                                                color="light-blue"
                                                size="lg"
                                                className="h-12 w-12"
                                            />
                                        ))}
                                    </div>
                                    <div className="grow flex flex-col">
                                        <div className="text-lg text-right">
                                            {chat.name || chat.users.map(user => user.username).join(', ')}
                                        </div>
                                        <div className="text-sm text-right text-gray-500">
                                            {chat.messages[chat.messages.length - 1]?.message}
                                        </div>
                                    </div>
                                </div>
                            </ListItem>
                        ))}
                    </List>
                </Card>
                {showCreateNewChat && (
                    <CreateNewChat
                        socket={socket}
                        userId={user_id}
                        onClose={handleCloseNewChat}
                    />
                )}

                {Object.entries(messages).length > 0 && (
                    <Card className="flex-auto flex flex-col">
                        <div className="chat-header">
                            {editing ? (
                                <input
                                    type="text"
                                    value={chatName}
                                    onChange={handleNameChange}
                                    onBlur={submitNewName}
                                    onKeyPress={(e) => e.key === 'Enter' && submitNewName()}
                                />
                            ) : (
                                <h1 onClick={editName}>{chatName}</h1>
                            )}
                        </div>
                        <div className="flex-auto flex flex-col">
                            {messages.messages.map((msg, key) => (
                                <div key={key}>
                                    {messageComponent({
                                        sender: msg.sender,
                                        message: msg.message,
                                        avatar: msg.avatar,
                                    })}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-row p-5 space-x-2">
                            <input
                                type="text"
                                className="flex-auto p-2"
                                placeholder="Enter message"
                                onChange={(e) => setMessage(e.target.value)}
                                value={message}
                                onKeyDown={(e) => handleKeyDown(e, messages.chatID)}
                            />
                            <button
                                className="bg-blue-500 text-white p-2"
                                onClick={() => sendMessage(messages.chatID)}
                            >
                                Send
                            </button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Chat;
