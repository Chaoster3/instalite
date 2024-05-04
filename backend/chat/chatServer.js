const io = require('socket.io')(server, {
    cors: {
        origin: "*",  // Change to your frontend's URL for production
        methods: ["GET", "POST"]
    }
});

const chatController = require('./chatController');

io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    // Register user to socket and manage their status
    socket.on('registerUser', async ({ userId }) => {
        await chatController.addUser(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Join a chat session
    socket.on('joinRoom', async ({ sessionId, userId }) => {
        await chatController.joinRoom(userId, sessionId, socket.id);
        socket.join(sessionId);
        console.log(`User ${userId} joined room ${sessionId}`);
        const messages = await chatController.fetchMessagesForSession(sessionId);
        socket.emit('historicalMessages', messages);
    });

    // Handle sending a new message
    socket.on('chatMessage', async ({ sessionId, userId, message }) => {
        await chatController.saveMessage(sessionId, userId, message);
        io.to(sessionId).emit('newMessage', { userId, message, timestamp: new Date() });
    });

    // Disconnecting from all sessions
    socket.on('disconnecting', async () => {
        await chatController.handleDisconnect(socket.id);
    });

    // Leave a specific chat
    socket.on('leaveChat', async ({ sessionId, userId }) => {
        await chatController.leaveRoom(userId, sessionId);
    });

    // Invite management
    socket.on('sendInvite', ({ sessionId, inviteeId }) => {
        io.to(inviteeId).emit('receiveInvite', { sessionId, inviterId: socket.userId });
    });

    socket.on('acceptInvite', async ({ sessionId, userId }) => {
        await chatController.joinRoom(userId, sessionId, socket.id);
        socket.join(sessionId);
        socket.to(sessionId).emit('userJoined', userId);
    });

    socket.on('rejectInvite', ({ sessionId, userId }) => {
        io.to(userId).emit('inviteRejected', { sessionId });
    });
});
