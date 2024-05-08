const db = dbsingleton;


exports.joinRoom = async (userId, sessionId) => {
    const sql = `INSERT INTO session_memberships (user_id, session_id) VALUES (?, ?)`;
    await db.send_sql(sql, [userId, sessionId]);
    await this.updateUserStatus(userId, sessionId, true);
};

exports.saveMessage = async (sessionId, userId, message) => {
    const sql = `INSERT INTO chat_messages (session_id, user_id, message) VALUES (?, ?, ?)`;
    await db.send_sql(sql, [sessionId, userId, message]);
};

exports.fetchMessagesForSession = async (sessionId) => {
    const sql = `SELECT message FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC`;
    return db.send_sql(sql, [sessionId]);
};

exports.leaveRoom = async (userId, sessionId) => {
    const sql = `DELETE FROM session_memberships WHERE user_id = ? AND session_id = ?`;
    await db.send_sql(sql, [userId, sessionId]);
    await this.updateUserStatus(userId, sessionId, false);
    await this.checkSessionMembers(sessionId);
};

exports.handleDisconnect = async (socketId) => {
    const findUserSql = `SELECT user_id, session_id FROM session_memberships WHERE socket_id = ?`;
    const userSessions = await db.send_sql(findUserSql, [socketId]);
    userSessions.forEach(async session => {
        await this.leaveRoom(session.user_id, session.session_id);
    });
};

exports.updateUserStatus = async (userId, sessionId, isActive) => {
    const sql = `UPDATE session_memberships SET is_active = ? WHERE user_id = ? AND session_id = ?`;
    await db.send_sql(sql, [isActive ? 1 : 0, userId, sessionId]);
};

exports.checkSessionMembers = async (sessionId) => {
    const sql = `SELECT user_id FROM session_memberships WHERE session_id = ? AND is_active = TRUE`;
    const activeMembers = await db.send_sql(sql, [sessionId]);
    if (activeMembers.length === 0) {
        await this.deleteSession(sessionId);
    }
};

exports.deleteSession = async (sessionId) => {
    const sql = `DELETE FROM chat_sessions WHERE session_id = ?`;
    await db.send_sql(sql, [sessionId]);
};

exports.getSessionUsers = async (sessionId) => {
    const sql = `SELECT u.user_id, u.username, u.avatar_url FROM users u JOIN session_memberships sm ON u.user_id = sm.user_id WHERE sm.session_id = ?`;
    return db.send_sql(sql, [sessionId]);
};

exports.createChatSession = async (chatName, userIds) => {
    const sql = `INSERT INTO chat_sessions (session_name) VALUES (?)`;
    const result = await db.send_sql(sql, [chatName]);
    const sessionId = result.insertId;

    return sessionId;
};

exports.loadUserChats = async (userId) => {
    const sessionsSql = `
        SELECT sm.session_id, cs.session_name
        FROM session_memberships sm
        JOIN chat_sessions cs ON sm.session_id = cs.session_id
        WHERE sm.user_id = ?`;
    const sessions = await db.send_sql(sessionsSql, [userId]);

    return Promise.all(sessions.map(async (session) => {
        const usersSql = `
            SELECT u.username, u.avatar_url
            FROM users u
            JOIN session_memberships sm ON u.user_id = sm.user_id
            WHERE sm.session_id = ?`;
        const users = await db.send_sql(usersSql, [session.session_id]);

        const messagesSql = `
            SELECT cm.user_id, cm.message, u.avatar_url
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.user_id
            WHERE cm.session_id = ?
            ORDER BY cm.timestamp ASC`;
        const messages = await db.send_sql(messagesSql, [session.session_id]);

        return {
            name: session.session_name,
            users: users.map(user => ({
                avatar: user.avatar_url,
                username: user.username
            })),
            messages: messages.map(msg => ({
                sender: msg.user_id, // Assuming you store the user ID, you may need to resolve this to a username if necessary
                message: msg.message,
                avatar: msg.avatar_url
            })),
            chatID: session.session_id
        };
    }));
};