const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const db = dbsingleton;

exports.createComment = async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.session;
  const { content, hashtag_names } = req.body;

  if (user_id == null) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'User not logged in.' });
  }

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

    // Convert hashtag names into hashtag ids
    const hashtag_ids = [];
    for (let i = 0; i < hashtag_names.length; i++) {
      const hashtag = await db.send_sql(
        `SELECT * FROM hashtags WHERE name = '${hashtag_names[i]}'`
      );
      if (hashtag.length === 0) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: `Hashtag ${hashtag_names[i]} does not exist.` });
      }
      hashtag_ids.push(hashtag[0].hashtag_id);
    }

    // Insert the comment
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.send_sql(
      `INSERT INTO comments (author_id, post_id, content, timestamp, hashtag_ids) VALUES (${user_id}, ${postId}, '${content}', '${timestamp}', '${hashtag_ids}')`
    );
    return res.status(HTTP_STATUS.SUCCESS).json({ success: 'Comment created successfully.' });
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
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

// Get all the comments for a specific post
exports.getCommentContent = async (req, res) => {
  const { postId } = req.params;

  try {
    const comments = await db.send_sql(`
      SELECT comments.content AS content, users.username AS author, comments.hashtag_ids AS hashtag_ids, comments.timestamp AS timestamp
      FROM comments
        JOIN users ON comments.author_id = users.user_id
      WHERE comments.post_id = ${postId}`
    );

    // Change hashtag_ids to the names
    for (let i = 0; i < comments.length; i++) {
      const hashtag_ids = comments[i].hashtag_ids.split(',');
      const hashtag_names = [];
      for (let j = 0; j < hashtag_ids.length; j++) {
        if (hashtag_ids[j] === '') continue;
        const hashtag = await db.send_sql(
          `SELECT name FROM hashtags WHERE hashtag_id = ${hashtag_ids[j]}`
        );
        hashtag_names.push(hashtag[0].name);
      }
      comments[i].hashtag_ids = hashtag_names;
    }


    return res.status(HTTP_STATUS.SUCCESS).json(comments);
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}
