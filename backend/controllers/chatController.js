const dbsingleton = require('../access/db_access');


const db = dbsingleton;


exports.joinRoom = async (userId, sessionId) => {
    const sql = `INSERT INTO session_memberships (user_id, session_id) VALUES (${userId}, ${sessionId})`;
    await db.send_sql(sql, [userId, sessionId]);
    await this.updateUserStatus(userId, sessionId, true);
};

exports.saveMessage = async (sessionId, userId, message) => {
    const sql = `INSERT INTO chat_messages (session_id, sender_id, message) VALUES (${sessionId}, ${userId}, '${message.replace(/'/g, "''")}')`;
    await db.send_sql(sql,);
};

exports.fetchMessagesForSession = async (sessionId) => {
    const sql = `SELECT message FROM chat_messages WHERE session_id = ${sessionId} ORDER BY timestamp ASC`;
    return db.send_sql(sql);
};

exports.leaveRoom = async (userId, sessionId) => {
    const sql = `DELETE FROM session_memberships WHERE user_id = ${userId} AND session_id = ${sessionId}`;
    await db.send_sql(sql);
    await this.checkSessionMembers(sessionId);
};

exports.handleDisconnect = async (userId) => {
    const findUserSql = `SELECT user_id, session_id FROM session_memberships WHERE user_id = ` + userId;
    const userSessions = await db.send_sql(findUserSql);
    userSessions.forEach(async session => {
        await this.leaveRoom(session.user_id, session.session_id);
    });
};

exports.updateUserStatus = async (userId, sessionId, isActive) => {
    const sql = `UPDATE session_memberships SET is_active = ${isActive} WHERE user_id = ${userId} AND session_id = ${sessionId}`;
    await db.send_sql(sql);
};

exports.checkSessionMembers = async (sessionId) => {
    const sql = `SELECT user_id FROM session_memberships WHERE session_id = ${sessionId} AND is_active = TRUE`;
    const activeMembers = await db.send_sql(sql);
    if (activeMembers.length === 0) {
        await this.deleteSession(sessionId);
    }
};

exports.deleteSession = async (sessionId) => {
    const sql = `DELETE FROM chat_sessions WHERE session_id = ` + sessionId;
    await db.send_sql(sql);
};

exports.getSessionUsers = async (sessionId) => {
    const sql = `SELECT u.user_id, u.username, u.image_id FROM users u JOIN session_memberships sm ON u.user_id = sm.user_id WHERE sm.session_id = ` + sessionId;
    return db.send_sql(sql);
};

exports.createChatSession = async (chatName, userIds) => {
    const sql = `INSERT INTO chat_sessions (session_name) VALUES ('${chatName}')`;
    const result = await db.send_sql(sql);
    const sessionId = result.insertId;

    return sessionId;
}; 

exports.loadUserChats = async (userId) => {
    // Query to get all chat sessions that a user is part of
    const sessionsSql = `
        SELECT sm.session_id, cs.session_name
        FROM session_memberships sm
        JOIN chat_sessions cs ON sm.session_id = cs.session_id
        WHERE sm.user_id = ` + userId;
    const sessions = await db.send_sql(sessionsSql, [userId]);

    // Map over each session to gather users and messages
    return Promise.all(sessions.map(async (session) => {
        // Query to get all users in a given chat session
        const usersSql = `
            SELECT u.username, u.image_id as avatar
            FROM users u
            JOIN session_memberships sm ON u.user_id = sm.user_id
            WHERE sm.session_id = ` + session.session_id;
        const users = await db.send_sql(usersSql);

        // Query to get all messages in a given chat session
        const messagesSql = `
            SELECT cm.sender_id, u.username as sender, cm.message, u.image_id as avatar
            FROM chat_messages cm
            JOIN users u ON cm.sender_id = u.user_id
            WHERE cm.session_id = ${session.session_id}
            ORDER BY cm.timestamp ASC`;
        const messages = await db.send_sql(messagesSql);


        return {
            chatID: session.session_id,
            name: session.session_name,
            users: users.map(user => ({
                username: user.username,
                avatar: user.avatar
            })),
            messages: messages.map(msg => ({
                sender: msg.sender,
                message: msg.message,
                avatar: msg.avatar
            }))
        };
    }));
};

exports.renameChatSession = async (sessionId, newName) => {
    console.log("trying to query update");
    const sql = `UPDATE chat_sessions SET session_name = '${newName}' WHERE session_id = ${sessionId}`;
    await db.send_sql(sql);
};

exports.addUserToSession = async (userId, sessionId, isActive) => {
    const sql = `INSERT INTO session_memberships (user_id, session_id, is_active) VALUES  (${userId}, ${sessionId}, ${isActive})`;
    await db.send_sql(sql);
};

exports.activateUserInSession = async (userId, sessionId) => {
    const sql = `UPDATE session_memberships SET is_active = TRUE WHERE user_id = ${userId} AND session_id = ${sessionId}`;
    await db.send_sql(sql);
};

exports.getUserIdByUsername = async (username) => {
    const sql = `SELECT user_id FROM users WHERE username = '${username}'`;
    const result = await db.send_sql(sql);
    console.log(result[0].user_id);
    return result[0].user_id;
};

exports.checkFriendship = async (userId1, userId2) => {
    const sql = `SELECT EXISTS (SELECT 1 FROM friends WHERE follower = ${userId1} AND followed = ${userId2})`;
    const result = await db.send_sql(sql);
    console.log(result[0]['EXISTS (SELECT 1 FROM friends WHERE user_id1 = ? AND user_id2 = ?)'] === 1);
    return result[0]['EXISTS (SELECT 1 FROM friends WHERE user_id1 = ? AND user_id2 = ?)'] === 1;
};