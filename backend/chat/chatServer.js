const io = require('socket.io')(server, {
    cors: {
        origin: "*",  // this should be frontend's URL
        methods: ["GET", "POST"]
    }
});

io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    // Join a chat session
    socket.on('joinRoom', ({ sessionId, userId }) => {
        socket.join(sessionId);
        updateUserStatus(userId, sessionId, true);
        console.log(`User ${userId} joined room ${sessionId}`);
        // Fetch and emit historical messages
        fetchMessagesForSession(sessionId).then(messages => {
            socket.emit('historicalMessages', messages);
        });
    });

    // Handle sending a new message
    socket.on('chatMessage', msg => {
        const { sessionId, senderId, message } = msg;
        saveMessage(sessionId, senderId, message).then(() => {
            io.to(sessionId).emit('newMessage', { senderId, message, timestamp: new Date() });
        });
    });

    socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room !== socket.id) {  // Skip the default room named after the socket ID
                socket.leave(room);
                socket.to(room).emit('userLeft', { userId: socket.userId, roomId: room });
                updateUserStatus(socket.userId, room, false).then(() => {
                    console.log(`Updated status to inactive for user ${socket.userId} in room ${room}`);
                });
            }
        });
    });
    socket.on('leaveChat', ({ sessionId, userId }) => {
        socket.leave(sessionId);
        updateUserStatus(userId, sessionId, false).then(() => {
            checkSessionMembers(sessionId);
        });
    });

    // Sending an invite
    socket.on('sendInvite', ({ sessionId, inviteeId }) => {
        io.to(inviteeId).emit('receiveInvite', { sessionId, inviterId: socket.userId });
    });

    // Handling invite acceptance
    socket.on('acceptInvite', ({ sessionId, userId }) => {
        socket.join(sessionId);
        updateUserStatus(userId, sessionId, true);
        socket.to(sessionId).emit('userJoined', userId);
    });

    // Handling invite rejection
    socket.on('rejectInvite', ({ sessionId, userId }) => {
        io.to(userId).emit('inviteRejected', { sessionId });
    });
});
