exports.createComment = async (req, res) => {
  const { post_id } = req.params;
  const { content, hashtags } = req.body;

  if (content == null) {
    return res.status(400).json({ error: 'Content cannot be empty.' });
  }

  try {
    // Check if post exists
    const post = await db.send_sql(
      `SELECT * FROM posts WHERE post_id = ${post_id}`
    );
    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Insert the comment
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const comment = await db.send_sql(
      `INSERT INTO comments (user_id, post_id, content, hashtags, timestamp) VALUES (${req.session.user_id}, ${post_id}, '${content}', '${hashtags}', '${timestamp}')`
    );
    return res.status(200).json({ success: 'Comment created successfully.' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error querying database.' });
  }
};

exports.getComment = async (req, res) => {
  const { comment_id } = req.params;

  try {
    const comment = await db.send_sql(
      `SELECT * FROM comments WHERE comment_id = ${comment_id}`
    );
    if (comment.length === 0) {
      return res.status(404).json({ error: 'Comment not found.' });
    }
    return res.status(200).json(comment[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error querying database.' });
  }
}

exports.getAllComments = async (req, res) => {
  try {
    const comments = await db.send_sql(
      `SELECT * FROM comments`
    );
    return res.status(200).json(comments);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error querying database.' });
  }
}