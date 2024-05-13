import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Avatar, Card, List, ListItem, ListItemSuffix } from "@material-tailwind/react"
import { PencilSquareIcon } from "@heroicons/react/24/solid"
import CreateNewChat from './CreateNewChat' 
import AddNewUser from './AddNewUser' 

import axios from 'axios';
import { BACKEND_URL } from "./utils/constants";
import { PlusIcon } from "@heroicons/react/24/solid";


const messageComponent = ({ sender, message, avatar, username }) => {
    sender = sender.toLowerCase();
    username = username.toLowerCase();
    return (
        <div
            className={`w-full p-5 flex flex-row ${sender === username && "justify-end"
                } space-x-3`}
        >
            {sender !== username && <Avatar src={avatar} color="light-blue" size="lg" className="h-8 w-8" />}
            <div
                className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === username ? "bg-blue-100" : "bg-gray-200"
                    }`}
            >
                {message}
            </div>
            {sender === username && <Avatar src={avatar} color="light-blue" size="lg" className="h-8 w-8" />}
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
    const [showCreateNewUser, setShowCreateNewUser] = useState(false);

    const [user_id, setUser] = useState("");
    const [username, setUsername] = useState("");

    const [socket, setSocket] = useState(null);

    const messagesRef = useRef(messages);

    const chatsRef = useRef(chats);


    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);



    const handleCreateNewChat = () => {
        setShowCreateNewChat(true); // Open the popup
    };

    const handleCloseNewChat = () => {
        setShowCreateNewChat(false); // Close the popup
    };

    const handleCreateAddUser = () => {
        setShowCreateNewUser(true); // Open the popup
    };

    const handleCloseAddUser = () => {
        setShowCreateNewUser(false); // Close the popup
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
        chatsRef.current = chats;
        console.log(`chats has changed to: ${chats.length}`);
    }, [chats]);

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
                const newSocket = io('localhost:3005', {
                    query: { userId: response.data.data },
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
        socket.on('receiveInvite', ({ sessionId, inviterId, usrId, chat_name }) => {
            const accept = window.confirm(`Accept invitation to join ${chat_name} by ${usrId}?`);
            console.log(`Invitation response by ${usrId} : ${accept} and here is sess_id: ${sessionId} and inviter id is ${inviterId}`);

            socket.emit('respondToInvite', { sessionId: sessionId, userId: usrId, chat_name: chat_name, accept: accept });
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
                    name: chatInfo.chat_name || "New Chat",
                    chatID: chatInfo.chatID,
                    users: chatInfo.users,
                    messages: chatInfo.messages || [] 
                }
            ]);
        });

        socket.on('userLeft', (data) => {
            console.log("Current chats:", chatsRef.current);
            console.log("Username of the user who left:", data.username);
            const updatedChats = chatsRef.current.map(chat => {
                if (chat.chatID === data.sessionId) {
                    // Filter out the user who left the chat
                    const updatedUsers = chat.users.filter(user => user.username !== data.username);
                    return { ...chat, users: updatedUsers };
                }
                return chat;
            });

            setChats(updatedChats);
            console.log(`Updated chats after user left:`, updatedChats);

        });

        socket.on('leftChat', (data) => {
            if (data.success) {
                //have to make chats use ref thing
                console.log("leaving: CHATS", chatsRef.current);
                console.log("leaving: chat id", data.chatID);
                const updatedChats = chatsRef.current.filter(chat => chat.chatID !== data.chatID);

                setChats(updatedChats);
                console.log(`leaving: message id ${messagesRef.current.chatID} ande here is the data id ${data.chatID}`);

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

    const leaveChat = (chatID) => {
        if (socket) {
            console.log('Leaving chat:', chatID);
            socket.emit('leaveChat', { sessionId: chatID, userId: user_id });
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
                        chatId={-1}
                    />
                )}

                {showCreateNewUser && (
                    <AddNewUser
                        socket={socket}
                        userId={user_id}
                        onClose={handleCloseAddUser}
                        chatId={messages.chatID}
                    />
                )}

                {Object.entries(messages).length > 0 && (

                    <Card className="flex-auto flex flex-col">
                        <button
                            className="bg-red-500 text-white p-2"
                            onClick={() => leaveChat(messages.chatID)}
                        >
                            Leave Chat
                        </button>
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

                        <div className="flex-auto flex flex-col overflow-y-auto max-h-96">
                            <button
                                onClick={handleCreateAddUser}
                                className="p-2 bg-blue-500 text-white rounded-full"
                                title="Add user to chat"
                            >
                                <PlusIcon className="h-1 w-1" />
                            </button>
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
