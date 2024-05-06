import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Avatar, Card, List, ListItem, ListItemSuffix } from "@material-tailwind/react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

const socket = io('http://localhost:3000'); 

const Chat = () => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState({});
    const [chats, setChats] = useState([]);

    useEffect(() => {
        socket.on('historicalMessages', (data) => {
            setChats(data);
        });

        socket.on('newMessage', (newMessage) => {
            setChats((currentChats) => {
                return currentChats.map((chat) => {
                    if (chat.chatID === newMessage.chatID) {
                        return { ...chat, messages: [...chat.messages, newMessage] };
                    }
                    return chat;
                });
            });
        });

        return () => {
            socket.off('historicalMessages');
            socket.off('newMessage');
        };
    }, []);

    const sendMessage = (chatID) => {
        if (message) {
            socket.emit('chatMessage', { chatID, message });
            setMessage('');
        }
    };

    const handleKeyDown = (event, chatID) => {
        if (event.key === 'Enter') {
            sendMessage(chatID);
        }
    };

    return (
        <div className="flex space-x-5 flex-row">
            <Card className="w-96 flex flex-row justify-end self-start">
                <List>
                    {chats.map((chat, key) => (
                        <ListItem
                            key={key}
                            onClick={() => setMessages({ messages: chat.messages, chatID: chat.chatID })}
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
            {Object.entries(messages).length > 0 && (
                <Card className="flex-auto flex flex-col">
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
    );
};

export default Chat;
