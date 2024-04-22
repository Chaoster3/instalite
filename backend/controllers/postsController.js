exports.createPost = async (req, res) => {
  const {image, content, hashtag} = req.body;

  // Cannot all be null
  if (image == null && content == null && hashtag == null) {
    return res.status(400).json({error: 'All fields cannot be empty.'});
  }

  try {
    const post = await db.send_sql(
      `INSERT INTO posts (user_id, image, content, hashtag) VALUES (${req.session.user_id}, '${image}', '${content}', '${hashtag}')`
    );
    return res.status(200).json({success: 'Post created successfully.'});
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: 'Error querying database.'});
  }
}

exports.getPost = async (req, res) => {
  const {post_id} = req.params;

  try {
    const post = await db.send_sql(
      `SELECT * FROM posts WHERE post_id = ${post_id}`
    );
    if (post.length === 0) {
      return res.status(404).json({error: 'Post not found.'});
    }
    return res.status(200).json(post[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({error: 'Error querying database.'});
  }
}