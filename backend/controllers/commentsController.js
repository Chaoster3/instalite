const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const db = dbsingleton;

exports.createComment = async (req, res) => {
  const { postId } = req.params;
  const { content, hashtags } = req.body;

  if (content == null) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Content cannot be empty.' });
  }

  try {
    // Check if post exists
    const post = await db.send_sql(
      `SELECT * FROM posts WHERE post_id = ${postId}`
    );
    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Insert the comment
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.send_sql(
      `INSERT INTO comments (author_id, post_id, content, timestamp) VALUES (${req.session.user_id}, ${postId}, '${content}', '${timestamp}')`
    );
    return res.status(HTTP_STATUS.SUCCESS).json({ success: 'Comment created successfully.' });
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
};

exports.getComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await db.send_sql(
      `SELECT * FROM comments WHERE comment_id = ${commentId}`
    );
    if (comment.length === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    return res.status(200).json(comment[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error querying database.' });
  }
};

exports.getAllComments = async (req, res) => {
  try {
    const comments = await db.send_sql(`SELECT * FROM comments`);
    return res.status(200).json(comments);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error querying database.' });
  }
};
