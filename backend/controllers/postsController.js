const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const db = dbsingleton;

exports.createPost = async (req, res) => {
  const { image, content, hashtags } = req.body;

  // Cannot all be null
  if (image == null && content == null && hashtags == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'All fields cannot be empty.' });
  }

  try {
    await db.send_sql(
      `INSERT INTO posts (author_id, image, content) VALUES ('${req.session.user_id}', '${image}', '${content}')`
    );
    return res
      .status(HTTP_STATUS.CREATED)
      .json({ success: 'Post created successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
};

exports.getPost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await db.send_sql(
      `SELECT * FROM posts WHERE post_id = ${postId}`
    );
    if (post.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'Post not found.' });
    }
    return res.status(HTTP_STATUS.SUCCESS).json(post[0]);
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
};
