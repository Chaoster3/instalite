const io = require('socket.io')(server, {
    cors: {
        origin: "*",  // gotta fill in frontend URL
        methods: ["GET", "POST"]
    }
});

const chatController = require('./chatController');

io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    socket.on('registerUser', async ({ userId }) => {
        await chatController.addUser(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
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
