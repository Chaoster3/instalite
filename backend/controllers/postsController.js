const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const db = dbsingleton;

exports.createPost = async (req, res) => {
  const { image, content, hashtags } = req.body;
  const hashtag_names = hashtags;

  // Check if user is logged in
  if (req.session.user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'User not logged in.' });
  }

  // Cannot all be null
  if (image == null && content == null && hashtags == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'All fields cannot be empty.' });
  }

  try {
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

    await db.send_sql(
      `INSERT INTO posts (author_id, image, content, hashtag_ids) VALUES ('${req.session.user_id}', '${image}', '${content}', '${hashtag_ids}')`
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
