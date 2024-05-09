const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const kafka = require('../kafka');
const process = require('process');
const aws = require('aws-sdk');


const db = dbsingleton;

const s3 = new aws.S3({
  region: process.env.S3_REGION
});

exports.createPost = async (req, res) => {
  const { content, hashtag_names } = req.body;

  // Check if user is logged in
  if (req.session.user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'User not logged in.' });
  }

  // Cannot all be null
  if (content == null && hashtags == null) {
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

    const file = req.file;
    if (file != null) {
      const count = await db.send_sql(
        `SELECT MAX(post_id) as count FROM posts`
      );
      fs.readFile(file.path, (err, data) => {
        if (err) {
          console.error('Error reading image file:', err);
          return res.status(500).send('Error uploading image');
        } else {
          const key = user_id + count[0]['count'];
          const params = {
            Bucket: process.env.S3_BUCKET_2,
            Key: key,
            Body: data
          };
          const responseData = {};
          responseData.matches = [];
          s3.upload(params, async (err, s3Data) => {
            if (err) {
              console.error('Error uploading to S3:', err);
              return res.status(500).send('Error uploading file');
            } else {
              content = content + "\n\n" + "<img src=" + s3Data.location + " alt=image>";
            }});
          }
        })
    }
    const q = `INSERT INTO posts (author_id, content, hashtag_ids) VALUES (?, ?, ?)`;
    await db.insert_items(q, [req.session.user_id, content, JSON.stringify(hashtag_ids)])
    const latest = await db.send_sql(
      `SELECT MAX(post_id) as latest FROM posts`
    );
    const data = await db.send_sql(
      `SELECT username FROM users WHERE user_id = ${req.session.user_id}`
    );
    await kafka.publishPost(data[0].username, latest[0].latest, content);
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

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await db.send_sql(`SELECT * FROM posts`);
    return res.status(HTTP_STATUS.SUCCESS).json(posts);
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}


exports.getTrendingPosts = async (req, res) => {
  try {
    const posts = await db.send_sql(`
      SELECT *,
            (LENGTH(user_ids_who_liked) - LENGTH(REPLACE(user_ids_who_liked, ',', '')) + 1) AS like_count
      FROM posts
      ORDER BY like_count DESC
      LIMIT 5;
    `);

    // Convert each post's hashtag_ids into hashtag_names
    for (let i = 0; i < posts.length; i++) {
      posts[i].hashtag_names = [];
      const hashtag_ids = JSON.parse(posts[i].hashtag_ids);
      for (let j = 0; j < hashtag_ids.length; j++) {
        const hashtag = await db.send_sql(
          `SELECT * FROM hashtags WHERE hashtag_id = ${hashtag_ids[j]}`
        );
        posts[i].hashtag_names.push(hashtag[0].name);
      }
    }

    return res.status(HTTP_STATUS.SUCCESS).json(posts);
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}