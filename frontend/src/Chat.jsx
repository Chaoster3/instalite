import React, { useState } from "react";
import {
  Avatar,
  Card,
  List,
  ListItem,
  ListItemSuffix,
} from "@material-tailwind/react";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

//TODO: Frontend Functionality

const messageComponent = ({ sender, message, avatar }) => {
  return (
    <div
      className={`w-full p-5 flex flex-row ${
        sender === "self" && "justify-end"
      } space-x-3`}
    >
      <div
        className={`text-left max-w-[70%] p-3 rounded-md break-words ${
          sender === "self" ? "bg-blue-100" : "bg-gray-200"
        }`}
      >
        {message}
      </div>
      <Avatar src={avatar} color="light-blue" size="lg" className="h-8 w-8" />
    </div>
  );
};
export function Chat() {
    const [message, setMessage] = useState("");
  const [messages, setMessages] = useState({});
  const [chats, setChats] = useState([
    {
      name: null,
      users: [
        {
          avatar: "https://docs.material-tailwind.com/img/face-2.jpg",
          username: "self",
        },
        {
          avatar: "https://docs.material-tailwind.com/img/face-3.jpg",
          username: "user",
        },
      ],
      messages: [
        {
          sender: "user",
          message: "Hello",
          avatar: "https://docs.material-tailwind.com/img/face-3.jpg",
        },
        {
          sender: "self",
          message: "Hi",
          avatar: "https://docs.material-tailwind.com/img/face-2.jpg",
        },
      ],
      chatID: 0,
    },
    {
      name: "Tripped-up Turnips",
      users: [
        {
          avatar: "https://docs.material-tailwind.com/img/face-2.jpg",
          username: "self",
        },
        {
          avatar: "https://docs.material-tailwind.com/img/face-3.jpg",
          username: "user1",
        },
        {
          avatar: "https://docs.material-tailwind.com/img/face-4.jpg",
          username: "user2",
        },
        {
            avatar: "https://docs.material-tailwind.com/img/face-5.jpg",
            username: "user3",
        }
      ],
      messages: [
        {
          sender: "user1",
          message: "Hello",
          avatar: "https://docs.material-tailwind.com/img/face-3.jpg",
        },
        {
          sender: "user2",
          message: "How are you?",
          avatar: "https://docs.material-tailwind.com/img/face-4.jpg",
        },
        {
          sender: "self",
          message: "Hi",
          avatar: "https://docs.material-tailwind.com/img/face-2.jpg",
        },
        {
          sender: "user3",
          message: "What's up?",
          avatar: "https://docs.material-tailwind.com/img/face-5.jpg",
        },
      ],
      chatID: 1,
    },
  ]);
  return (
    <div className="flex space-x-5 flex-row">
      <Card className="w-96 flex flex-row justify-end self-start">
        <List>
          <ListItem className="self-end w-12 items-center">
            <ListItemSuffix>
              {" "}
              <PencilSquareIcon className="h-6 w-6 text-gray-500" />
            </ListItemSuffix>
          </ListItem>
          {chats.map((chat, key) => (
            <ListItem
              key={key}
              onClick={() =>
                setMessages({ messages: chat.messages, chatID: chat.chatID })
              }
            >
              <div className="w-96 flex flex-row items-center gap-2 p-2">
                <div className="flex items-center -space-x-4">
                  {chat.users.map(
                    (user, key) =>
                      user.username !== "self" && (
                        <Avatar
                          key={key}
                          src={user.avatar}
                          color="light-blue"
                          size="lg"
                          className="h-12 w-12"
                        />
                      )
                  )}
                </div>
                <div className="grow flex flex-col">
                  <div className="text-lg text-right">
                    {" "}
                    {chat.name === null
                      ? chat.users
                          .map((user) =>
                            user.username !== "self" ? user.username : null
                          )
                          .filter(Boolean)
                          .join(", ")
                      : chat.name}
                  </div>
                  <div className="text-sm text-right text-gray-500">
                    {chat.messages[0].message}
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
            {messages.messages.map((message, key) => (
              <div key={key}>
                {messageComponent({
                  sender: message.sender,
                  message: message.message,
                  avatar: message.avatar,
                })}
              </div>
            ))}
          </div>
          {
            <div className="flex flex-row p-5 space-x-2">
              <input
                type="text"
                className="flex-auto p-2"
                placeholder="Enter message"
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    let currChat = chats.filter(
                      (chat) => chat.chatID === messages.chatID
                    )[0];
                    let otherChats = chats.filter(
                      (chat) => chat.chatID !== messages.chatID
                    );
                    currChat.messages.push({
                      sender: "self",
                      message: message,
                      avatar:
                        "https://docs.material-tailwind.com/img/face-2.jpg",
                    });
                    setChats([currChat, ...otherChats]);
                    setMessages({
                      messages: currChat.messages,
                      chatID: messages.chatID,
                    });
                    setMessage("");
                  }
                }}
              />
              <button
                className="bg-blue-500 text-white p-2"
                onClick={() => {
                  let currChat = chats.filter(
                    (chat) => chat.chatID === messages.chatID
                  )[0];
                  let otherChats = chats.filter(
                    (chat) => chat.chatID !== messages.chatID
                  );
                  currChat.messages.push({
                    sender: "self",
                    message: message,
                    avatar: "https://docs.material-tailwind.com/img/face-2.jpg",
                  });
                  setChats([currChat, ...otherChats]);
                  setMessages({
                    messages: currChat.messages,
                    chatID: messages.chatID,
                  });
                  setMessage("");
                  document.querySelector("input").value = "";
                }}
              >
                Send
              </button>
            </div>
          }
        </Card>
      )}
    </div>
  );
}

export default Chat;
