import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Avatar, Card, List, ListItem, ListItemSuffix } from "@material-tailwind/react"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import CreateNewChat from './CreateNewChat' 
import axios from 'axios';
import { BACKEND_URL } from "./utils/constants";



const messageComponent = ({ sender, message, avatar, username }) => {
    console.log(`USERNAME IS ${username} and sender is ${sender} wiht message`)
    return (
        <div
            className={`w-full p-5 flex flex-row ${sender === username && "justify-end"
                } space-x-3`}
        >
            <div
                className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === username ? "bg-blue-100" : "bg-gray-200"
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
    const [user_id, setUser] = useState("");
    const [username, setUsername] = useState("");

    const [socket, setSocket] = useState(null);

    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);



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
        console.log(`The user_id has changed to: ${user_id}`);
    }, [user_id]);

    useEffect(() => {
        console.log(`The username has changed to: ${username}`);
    }, [username]);

    useEffect(() => {
        console.log(`Messages changed to: ${messages.chatID}`);
    }, [messages]);

    useEffect(() => {
        const fetchUser = async () => {
            console.log("GETTING USER ID");
          try {
              const response = await axios.get(`${BACKEND_URL}/users/getUserId`);
            if (response.status === 200) {
                setUser(response.data.data.toString());


                console.log(response.data.data);
                const newSocket = io('http://localhost:3005', {
                    query: { userId: response.data.data }
                });
                setSocket(newSocket);
                setupSocketListeners(newSocket);
                newSocket.emit('loadChats', { userId: response.data.data });
            } else {
                setUser("");
            }
              const response2 = await axios.get(`${BACKEND_URL}/users/checkIfLoggedIn`);
              if (response2.status === 200) {
                  setUsername(response2.data.data.toString());
                  console.log(response2.data.data.toString());
              } else {
                  setUsername("");
              }
          } catch (error) {
            console.error("Error fetching user:", error);
              setUser("");
              setUsername("");
          }
        }
    
        fetchUser();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
      }, []);

    const setupSocketListeners = (socket) => {
        socket.on('receiveInvite', ({ sessionId, inviterId, usrId }) => {
            const accept = window.confirm(`Accept invitation to join?`);
            console.log(`Invitation response by ${usrId} : ${accept} and here is sess_id: ${sessionId} and inviter id is ${inviterId}`);

            socket.emit('respondToInvite', { sessionId: sessionId, userId: usrId, accept: accept });
        });

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

        socket.on('historicalMessages', (newChats) => {
            console.log("in historical messages");

            if (newChats != null) {
                setChats(newChats);
            } 
        });

        socket.on('newMessage', (newMessage) => {
            console.log("GOT NEW MESSAGE", newMessage);
            setChats((currentChats) => {
                let updatedMessages = [];

                const updatedChats = currentChats.map((chat) => {
                    if (chat.chatID === newMessage.chatID) {
                        const updatedChat = { ...chat, messages: [...chat.messages, newMessage] };
                        updatedMessages = updatedChat.messages;
                        return updatedChat;
                    }
                    return chat;
                });

                setMessages({ messages: updatedMessages, chatID: newMessage.chatID });
                return updatedChats;
            });
        });

        socket.on('chatLoaded', (chatInfo) => {
            console.log("Received 'chatLoaded' event; id is ", chatInfo, chatInfo.chatID);
            setChats(currentChats => [
                ...currentChats,
                {
                    name: chatInfo.chatName || "New Chat",
                    chatID: chatInfo.chatID,
                    users: chatInfo.users,
                    messages: chatInfo.messages || [] 
                }
            ]);
            setMessages({ messages: chatInfo.messages || [], chatID: chatInfo.chatID });
        });

        socket.on('leftChat', (data) => {
            if (data.success) {
                const updatedChats = chats.filter(chat => chat.chatID !== data.chatID);

                setChats(updatedChats);
                console.log(`message id ${messages.chatID} ande here is the data id ${data.chatID}`);

                if (messagesRef.current.chatID === data.chatID) {
                    // Set messages to null or an empty object if the current chat is deleted
                    console.log("Setting messages to null");
                    setMessages({});
                    setMessage('');
                }

            } else {
                console.error('Failed to leave chat:', data.error);
            }
        });


    };


    const sendMessage = (chatID) => {
        if (message) {
            // socket.emit('chatMessage', { chatID, req.session.user_id, message });
            console.log('Sending message:', message, chatID);
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
                                    console.log(chat);
                                    setMessages({ messages: chat.messages, chatID: chat.chatID });
                                    console.log(messages);

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
                                        username: username
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
