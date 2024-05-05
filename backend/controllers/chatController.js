const db = dbsingleton;

exports.addUser = async (userId, socketId) => {
    const sql = `INSERT INTO user_connections (user_id, socket_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE socket_id = VALUES(socket_id)`;
    await db.send_sql(sql, [userId, socketId]);
};

exports.joinRoom = async (userId, sessionId, socketId) => {
    const sql = `REPLACE INTO session_memberships (user_id, session_id, socket_id) VALUES (?, ?, ?)`;
    await db.send_sql(sql, [userId, sessionId, socketId]);
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