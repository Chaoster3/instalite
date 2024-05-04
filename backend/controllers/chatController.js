const db = dbsingleton;

exports.saveMessage = async (sessionId, senderId, message) => {
    const sql = `INSERT INTO chat_messages (session_id, sender_id, message) VALUES (?, ?, ?)`;
    return db.send_sql(sql, [sessionId, senderId, message]);
};

exports.fetchMessagesForSession = async (sessionId) => {
    const sql = `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC`;
    return db.send_sql(sql, [sessionId]);
};


// Function to update user active status
exports.updateUserStatus = async (userId, sessionId, isActive) => {
    const sql = `
      UPDATE session_memberships
      SET is_active = ?
      WHERE user_id = ? AND session_id = ?`;
    try {
        await db.send_sql(sql, [isActive, userId, sessionId]);
        console.log(`Updated user ${userId} active status to ${isActive} in session ${sessionId}`);
    } catch (error) {
        console.error('Failed to update user status:', error);
    }
};

exports.checkSessionMembers = async (sessionId) => {
    const sql = `SELECT user_id FROM session_memberships WHERE session_id = ? AND is_active = TRUE`;
    try {
        const activeMembers = await db.send_sql(sql, [sessionId]);
        if (activeMembers.length === 0) {
            // Call another function to handle the cleanup
            await deleteSession(sessionId);
            console.log(`Session ${sessionId} deleted due to no active members.`);
        } else {
            console.log(`Session ${sessionId} has ${activeMembers.length} active members.`);
        }
    } catch (error) {
        console.error(`Failed to check session members for session ${sessionId}:`, error);
    }
};

exports.deleteSession = async (sessionId) => {
    const sql = `DELETE FROM chat_sessions WHERE session_id = ?`;
    try {
        await db.send_sql(sql, [sessionId]);
        console.log(`Deleted chat session ${sessionId}`);
    } catch (error) {
        console.error(`Failed to delete chat session ${sessionId}:`, error);
    }
};
