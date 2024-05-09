const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://3.90.82.97:5173", "http://3.90.82.97:5174"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const chatController = require('../controllers/chatController');

const userSockets = new Map();  // Map to hold userId to socketId

io.on('connection', socket => {
    const userId = socket.handshake.query.userId;

    console.log('A user connected:', socket.id, 'with user ID:', userId);
    userSockets.set(userId, socket.id);



    socket.on('createChat', async ({ userId, chatName }) => {


        const sessionId = await chatController.createChatSession(chatName);

        console.log("RECEIVED UID", userId);


        // Join each user to the chat session and notify them
        const userSocketId = userSockets.get(userId.toString());
        console.log("retrieved socket it", userSockets);
        if (userSocketId) {
            const socketToControl = io.sockets.sockets.get(userSocketId);
            console.log("joining room");
            socketToControl.join(sessionId);
            handleJoinRoom(socketToControl, sessionId, userId);
            console.log(`User ${userId} added to room ${sessionId} with socket ${userSocketId}`);
        }


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
        const avatar = await chatController.saveMessageAndGetAvatar(chatID, userId, message);
        const newMessage = {
            chatID,
            senderId: userId,
            message,
            timestamp: new Date(),
            avatar: avatar 
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
            socket.leave(sessionId, async () => {
                console.log(`User ${userId} has left room ${sessionId}`);
                socket.to(sessionId).emit('userLeft', { userId, sessionId });
                // Notify the leaving user as well
                socket.emit('leftChat', { chatID: sessionId, success: true });

                // Check if the session has no more active members
                const activeMembers = await chatController.checkSessionMembers(sessionId);
                if (activeMembers.length === 1) {
                    await chatController.deleteSession(sessionId);
                    // Broadcast to everyone in the session that it's being deleted
                    io.to(sessionId).emit('leftChat', { chatID: sessionId, success: true });
                    console.log(`Chat session ${sessionId} deleted due to no active members.`);
                }
            });
        } catch (error) {
            console.error('Error leaving chat:', error);
            socket.emit('leftChat', { chatID: sessionId, success: false, error: error.message });
        }
    });


    socket.on('sendInvite', async ({ inviteeUsername, sessionId, inviterId }) => {
        const inviteeId = await chatController.getUserIdByUsername(inviteeUsername);
        const ogSession = sessionId;
        if (!inviteeId) {
            console.log("Invalid username");
            return;
        }
        const areFriends = await chatController.checkFriendship(inviterId, inviteeId);

        console.log("INVITEE ID is", inviteeId);

        if (areFriends) {

            const inviteeSocketId = userSockets.get(inviteeId.toString());
            console.log(userSockets);
            if (inviteeSocketId) {
                if (ogSession == -1) {
                    sessionId = await chatController.createChatSession();
                }
                if (ogSession == -1) {
                    await chatController.addUserToSession(inviterId, sessionId, true); // Inviter is active by default; only add if creating new chat
                }
                await chatController.addUserToSession(inviteeId, sessionId, false); // Add with inactive flag

                io.to(inviteeSocketId).emit('receiveInvite', {
                    sessionId: sessionId,
                    inviterId: inviterId,
                    usrId: inviteeId
                });
                if (ogSession == -1) {
                    console.log("CREATING CHAT");
                    handleJoinRoom(socket, sessionId, userId);
                }
            } else {
                console.log("Did not sent invite. Invitee not online");
            }
        } else {
            console.log("Did not sent invte; not friends")
        }
    });

    // Event to handle response to invitations
    socket.on('respondToInvite', async ({ sessionId, userId, accept }) => {
        console.log(`HERE we have ${userId} and response ${accept}`)
        if (accept) {
            await chatController.activateUserInSession(userId, sessionId);
            socket.join(sessionId);
            handleJoinRoom(socket, sessionId, userId);
        } else {
            console.log(`In refect`);
            await chatController.leaveRoom(userId, sessionId);
            console.log(`User ${userId} is leaving left room ${sessionId}`);
            socket.to(sessionId).emit('userLeft', { userId, sessionId });
            // Notify the leaving user as well
            socket.emit('leftChat', { chatID: sessionId, success: true });

            // Check if the session has no more active members
            const activeMembers = await chatController.checkSessionMembers(sessionId);
            console.log("REMAINING MEMBERS", activeMembers);
            if (activeMembers.length === 1) {
                await chatController.deleteSession(sessionId);
                // Broadcast to everyone in the session that it's being deleted
                io.to(sessionId).emit('leftChat', { chatID: sessionId, success: true });
                console.log(`Chat session ${sessionId} deleted due to no active members.`);
            }
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
    console.log('Server is running on http://3.90.82.97:3005');
}).on('error', err => {
    console.error('Server failed to start:', err);
});