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
                io.to(userSocketId).emit('joinRoom', { sessionId, userId });
                io.sockets.sockets.get(userSocketId).join(sessionId);
                console.log(`User ${userId} added to room ${sessionId} with socket ${userSocketId}`);
            }
        });
        const users = await chatController.getSessionUsers(sessionId);


        // Emit back to the creator that the chat was successfully created
        socket.emit('chatCreated', { sessionId, chatName, users: users });
    });

    socket.on('loadChats', async ({ userId }) => {
        const chats = await chatController.loadUserChats(userId);
        socket.emit('historicalMessages', chats);
    });

    socket.on('joinRoom', async ({ sessionId, userId }) => {
        await chatController.joinRoom(userId, sessionId, socket.id);
        socket.join(sessionId);
        console.log(`User ${userId} joined room ${sessionId}`);
        const messages = await chatController.fetchMessagesForSession(sessionId);
        const users = await chatController.getSessionUsers(sessionId);
        socket.emit('historicalMessages', {
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

    socket.on('disconnecting', async () => {
        await chatController.handleDisconnect(socket.id);
        userSockets.forEach((value, key) => {
            if (value === socket.id) {
                userSockets.delete(key);
                console.log(`User ${key} disconnected and removed from the map`);
            }
        });
    });


    socket.on('leaveChat', async ({ sessionId, userId }) => {
        await chatController.leaveRoom(userId, sessionId);
        socket.to(sessionId).emit('userLeft', { userId, sessionId });
    });

    socket.on('sendInvite', ({ sessionId, inviteeId }) => {
        socket.to(inviteeId).emit('receiveInvite', { sessionId, inviterId: socket.userId });
    });

    socket.on('acceptInvite', async ({ sessionId, userId }) => {
        await chatController.joinRoom(userId, sessionId, socket.id);
        socket.join(sessionId);
        socket.to(sessionId).emit('userJoined', { userId, sessionId });
    });

    socket.on('rejectInvite', ({ sessionId, userId }) => {
        socket.to(userId).emit('inviteRejected', { sessionId });
    });
});

server.listen(3005, () => {
    console.log('Server is running on http://localhost:3005');
}).on('error', err => {
    console.error('Server failed to start:', err);
});