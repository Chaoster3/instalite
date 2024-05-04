const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const db = dbsingleton;

exports.changeActor = async (req, res) => {
  const { user_id } = req.session;
  const { img_id } = req.body;

  // Update the img_id field in the users table
  try {
    // Check if the user exists
    const user = await db.send_sql(
      `SELECT * FROM users WHERE user_id = ${user_id}`
    );
    if (user.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'User not found.' });
    }

    await db.send_sql(
      `UPDATE users SET img_id = ${img_id} WHERE user_id = ${user_id}`
    );
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Actor changed successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
};

exports.getFiveClosestActors = async (req, res) => {
  const { user_id } = req.session;

  // Find the actor_id associated with the current user
  try {
    const actor_id = await db.send_sql(
      `SELECT actor_id FROM users WHERE user_id = ${user_id}`
    );
    if (actor.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'Actor not found.' });
    }

    //// TODO: Find the 5 closest embeddings
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  const { user_id } = req.session;
  const { image_id } = req.body; // I'm assuming we're going to store the link to the image in s3

  // Update the img_id field in the users table
  try {
    // Check if the user exists
    const user = await db.send_sql(
      `SELECT * FROM users WHERE user_id = ${user_id}`
    );
    if (user.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'User not found.' });
    }

    await db.send_sql(
      `UPDATE users SET image_id = ${image_id} WHERE user_id = ${user_id}`
    );
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Profile picture uploaded successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.getAllFriends = async (req, res) => {
  console.log(req.session.user_id);
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to view your friends.' });
  }

  try {
    const friends = await db.send_sql(
      `SELECT users.username AS username
       FROM friends
        JOIN users ON friends.followed = users.user_id
       WHERE friends.follower = ${user_id}`
    );

    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ friends });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.getPostsMainPage = async (req, res) => {
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to view the main page.' });
  }

  try {
    const yourPosts = await db.send_sql(
      `SELECT users.username AS username, posts.content AS content, posts.image AS image, posts.post_id AS post_id, posts.hashtag_ids AS hashtag_ids
      FROM posts
        JOIN users ON posts.author_id = users.user_id
      WHERE posts.author_id = ${user_id}`
    );

    const friendsPosts = await db.send_sql(
      `SELECT users.username AS username, posts.content AS content, posts.image AS image, posts.post_id AS post_id, posts.hashtag_ids AS hashtag_ids
      FROM posts
        JOIN users ON posts.author_id = users.user_id
      WHERE author_id IN (SELECT followed from friends WHERE follower = ${user_id})`
    );

    const posts = yourPosts.concat(friendsPosts);

    // Convert each post's hashtag_ids into hashtag_names
    for (let i = 0; i < posts.length; i++) {
      const hashtag_ids = posts[i].hashtag_ids.split(',');
      const hashtag_names = [];
      for (let j = 0; j < hashtag_ids.length; j++) {
        const hashtag = await db.send_sql(
          `SELECT name FROM hashtags WHERE hashtag_id = ${hashtag_ids[j]}`
        );
        hashtag_names.push(hashtag[0].name);
      }
      posts[i].hashtag_names = hashtag_names;
    }

    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ posts });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.getPostsProminentFigures = async (req, res) => {
  return res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ error: "Haven't implemented." });
}

exports.addFriends = async (req, res) => {
  const { user_id } = req.session;
  const { friend_id } = req.body;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to add a friend.' });
  }

  if (friend_id == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Friend id cannot be empty.' });
  }

  try {
    //// TODO: Might need to go both ways
    await db.send_sql(
      `INSERT INTO friends (follower, followed) VALUES (${user_id}, ${friend_id})`
    );
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Friend added successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.removeFriends = async (req, res) => {
  const { user_id } = req.session;
  const { friend_id } = req.body;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to remove a friend.' });
  }

  if (friend_id == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Friend id cannot be empty.' });
  }

  try {
    //// TODO: Might need to go both ways
    await db.send_sql(
      `DELETE FROM friends WHERE follower = ${user_id} AND followed = ${friend_id}`
    );
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Friend removed successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.searchUserByUsername = async (req, res) => {
  const { username } = req.body;

  if (username == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Username cannot be empty.' });
  }

  try {
    const users = await db.send_sql(
      `SELECT * FROM users WHERE username = ${username}`
    );

    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ users });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.getUsernameFromID = async (req, res) => {
  const { userId } = req.params;

  if (userId == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'User id cannot be empty.' });
  }

  try {
    const users = await db.send_sql(
      `SELECT username FROM users WHERE user_id = ${userId}`
    );

    const user = users[0]
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ user });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}