const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const chatController = require('../controllers/chatController');

const userSockets = new Map();  // Map to hold userId to socketId

io.on('connection', socket => {
    console.log('A user connected:', socket.id);
    // userSockets.set(req.session.user_id, socket.id);
    userSockets.set(1, socket.id);



    socket.on('createChat', async ({ userIds, chatName }) => {


        const sessionId = await chatController.createChatSession(chatName);


        // Join each user to the chat session and notify them
        userIds.forEach(async (userId) => {
            const userSocketId = userSockets.get(userId);
            if (userSocketId) {
                const socketToControl = io.sockets.sockets.get(userSocketId);
                socketToControl.join(sessionId);
                handleJoinRoom(socketToControl, sessionId, userId);
                console.log(`User ${userId} added to room ${sessionId} with socket ${userSocketId}`);
            }
        });


    });

    socket.on('loadChats', async ({ userId }) => {
        const chats = await chatController.loadUserChats(userId);
        console.log(chats);

        // Join each chat session based on the chatID
        chats.forEach(chat => {
            socket.join(chat.chatID);
            console.log(`User ${userId} joined chat session ${chat.chatID}`);
        });

        socket.emit('historicalMessages', chats);
    });

    socket.on('joinRoom', async ({ sessionId, userId }) => {
        await chatController.joinRoom(userId, sessionId, socket.id);
        socket.join(sessionId);
        console.log(`User ${userId} joined room ${sessionId}`);
        const messages = await chatController.fetchMessagesForSession(sessionId);
        const users = await chatController.getSessionUsers(sessionId);
        socket.emit('chatLoaded', {
            chatID: sessionId,
            users,
            messages
        });
    });

    socket.on('chatMessage', async ({ chatID, userId, message }) => {
        await chatController.saveMessage(chatID, userId, message);
        const newMessage = {
            chatID,
            senderId: userId,
            message,
            timestamp: new Date(),
            avatar: "https://docs.material-tailwind.com/img/face-2.jpg"  // Example avatar
        };
        io.to(chatID).emit('newMessage', newMessage);
    });

    // socket.on('disconnecting', async () => {
    //     await chatController.handleDisconnect(req.session.user_id);
    //     userSockets.forEach((value, key) => {
    //         if (value === socket.id) {
    //             userSockets.delete(key);
    //             console.log(`User ${key} disconnected and removed from the map`);
    //         }
    //     });
    // });


    socket.on('leaveChat', async ({ sessionId, userId }) => {
        try {
            await chatController.leaveRoom(userId, sessionId);
            socket.leave(sessionId, () => {
                console.log(`User ${userId} has left room ${sessionId}`);
                socket.to(sessionId).emit('userLeft', { userId, sessionId });
                // Notify the leaving user as well
                socket.emit('leftChat', { chatID: sessionId, success: true });
            });
        } catch (error) {
            console.error('Error leaving chat:', error);
            socket.emit('leftChat', { chatID: sessionId, success: false, error: error.message });
        }
    });

    socket.on('sendInvite', async ({ inviteeUsername, sessionId, inviterId }) => {
        const inviteeId = await chatController.getUserIdByUsername(inviteeUsername);
        if (!inviteeId) {
            return;
        }
        const areFriends = await chatController.checkFriendship(inviterId, inviteeId);

        if (areFriends) {
            if (sessionId == -1) {
                sessionId = await chatController.createChatSession();
            }

            if (sessionId == -1) {
                await chatController.addUserToSession(inviterId, sessionId, true); // Inviter is active by default; only add if creating new chat
            }
            await chatController.addUserToSession(inviteeId, sessionId, false); // Add with inactive flag

            const inviteeSocketId = userSockets.get(inviteeId);
            if (inviteeSocketId) {
                io.to(inviteeSocketId).emit('receiveInvite', {
                    sessionId,
                    inviterId
                });
            }
        }
    });

    // Event to handle response to invitations
    socket.on('respondToInvite', async ({ sessionId, userId, accept }) => {
        if (accept) {
            await chatController.activateUserInSession(userId, sessionId);
            socket.join(sessionId);
            handleJoinRoom(socket, sessionId, userId);
        } else {
            await chatController.leaveRoom(userId, sessionId);
            socket.to(sessionId).emit('userLeft', { userId, sessionId });
        }
    });



    socket.on('renameChat', async ({ chatID, newName }) => {
        try {
            await chatController.renameChatSession(chatID, newName);
            io.to(chatID).emit('chatRenamed', { chatID, newName });
        } catch (error) {
            console.error('Error renaming chat:', error);
        }
    });

});

async function handleJoinRoom(socket, sessionId, userId) {
    await chatController.joinRoom(userId, sessionId, socket.id);
    socket.join(sessionId);
    console.log(`User ${userId} joined room ${sessionId}`);
    const messages = await chatController.fetchMessagesForSession(sessionId);
    const users = await chatController.getSessionUsers(sessionId);

    socket.emit('chatLoaded', {
        chatID: sessionId,
        users,
        messages
    });
}

server.listen(3005, () => {
    console.log('Server is running on http://localhost:3005');
}).on('error', err => {
    console.error('Server failed to start:', err);
});