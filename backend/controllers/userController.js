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
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to view your friends.' });
  }

  try {
    const friends = await db.send_sql(
      `SELECT DISTINCT users.username AS username, users.user_id AS user_id, users.logged_in AS logged_in
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
      if (posts[i].hashtag_ids === null) {
        posts[i].hashtag_names = [];
        continue;
      }

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
  const { friendId } = req.params;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to add a friend.' });
  }

  if (friendId == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Friend id cannot be empty.' });
  }

  try {
    // Check if friend id exists
    const friend = await db.send_sql(
      `SELECT * FROM users WHERE user_id = ${friendId}`
    );
    if (friend.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'Friend not found.' });
    }


    await db.send_sql(
      `INSERT INTO friends (follower, followed) VALUES (${user_id}, ${friendId})`
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
  const { friendId } = req.params;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to remove a friend.' });
  }

  if (friendId == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Friend id cannot be empty.' });
  }

  try {
    // Check if the friend exists
    const friend = await db.send_sql(
      `SELECT * FROM users WHERE user_id = ${friendId}`
    );
    if (friend.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'Friend not found.' });
    }

    await db.send_sql(
      `DELETE FROM friends WHERE follower = ${user_id} AND followed = ${friendId}`
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

exports.likePost = async (req, res) => {
  const { postId } = req.params;


  if (req.session.user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'User not logged in.' });
  }

  if (postId == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Post id cannot be empty.' });
  }

  try {
    // Check if the post exists
    const post = await db.send_sql(
      `SELECT * FROM posts WHERE post_id = ${postId}`
    );
    if (post.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'Post not found.' });
    }

    // Check if the user has already liked the post
    const user = await db.send_sql(
      `SELECT user_ids_who_liked FROM posts WHERE post_id = ${postId}`
    );

    var user_ids_who_liked = user[0].user_ids_who_liked;
    var new_user_ids_who_liked = []

    if (user_ids_who_liked === null) { // when no one has liked the post
      new_user_ids_who_liked = [req.session.user_id];
    } else { // appending the current user to the list of users who liked the post
      user_ids_who_liked = user[0].user_ids_who_liked.split(',');

      // Check if the user has already liked the post
      if (user_ids_who_liked.includes(String(req.session.user_id))) {
        console.log("user has already liked the post");
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: 'User has already liked the post.' });
      }

      new_user_ids_who_liked = user_ids_who_liked;
      new_user_ids_who_liked.push(req.session.user_id);
    }

    new_user_ids_who_liked = new_user_ids_who_liked.join(',');
    const sql = `UPDATE posts SET user_ids_who_liked = '${new_user_ids_who_liked}' WHERE post_id = '${postId}'`;

    await db.send_sql(sql);

    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Post liked successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }

}

exports.getLikedPosts = async (req, res) => {
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to view your liked posts.' });
  }

  try {
    const posts = await db.send_sql(
      `SELECT post_id FROM posts WHERE FIND_IN_SET('${user_id}', user_ids_who_liked) > 0;`
    );

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

exports.unlikePost = async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.session;

  // Check if the user is logged in
  if (user_id === null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'User not logged in.' });
  }

  // Check if the post id is provided
  if (postId === null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Post id cannot be empty.' });
  }

  try {
    // Check if the post exists
    const post = await db.send_sql(
      `SELECT * FROM posts WHERE post_id = ${postId}`
    );
    if (post.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'Post not found.' });
    }

    // Check if the user has already liked the post
    const user = await db.send_sql(
      `SELECT user_ids_who_liked FROM posts WHERE post_id = ${postId}`
    );

    var user_ids_who_liked = user[0].user_ids_who_liked;
    var new_user_ids_who_liked = []

    if (user_ids_who_liked === null) { // when no one has liked the post
      return res
        .status(HTTP_STATUS.SUCCESS)
        .json({ success: 'Post unliked successfully.' });
    } else { // remove the current user from the liked list
      user_ids_who_liked = user[0].user_ids_who_liked.split(',');
      new_user_ids_who_liked = user_ids_who_liked.filter(id => id !== String(user_id));
    }

    new_user_ids_who_liked = new_user_ids_who_liked.join(',');
    const sql = `UPDATE posts SET user_ids_who_liked = '${new_user_ids_who_liked}' WHERE post_id = '${postId}'`;

    await db.send_sql(sql);

    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Post unliked successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.getFriendRecommendation = async (req, res) => {
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to view friend recommendations.' });
  }

  try {
    const currentFriends = await db.send_sql(
      `SELECT followed FROM friends WHERE follower = ${user_id}`
    );

    const friendOfFriends = await db.send_sql(`
      SELECT DISTINCT f2.followed AS followed
      FROM friends f1
        JOIN friends f2 ON f1.followed = f2.follower
      WHERE f1.follower = ${user_id} AND f2.followed <> ${user_id}
    `);

    // Select people from friendOfFriends that aren't in currentFriends
    const friends = currentFriends.map(friend => friend.followed);
    const users = friendOfFriends.map(friend => friend.followed);

    var friendRecommendationIds = users.filter(user => !friends.includes(user));

    // Get the usernames of the friend recommendations
    var friendRecommendation = [];
    for (let i = 0; i < friendRecommendationIds.length; i++) {
      const username = await db.send_sql(
        `SELECT username, user_id FROM users WHERE user_id = ${friendRecommendationIds[i]}`
      );
      friendRecommendation.push(username[0]);
    }

    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ friendRecommendation });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.checkIfLikedPost = async (req, res) => {
  const { postId } = req.params;
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'User not logged in.' });
  }

  if (postId == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Post id cannot be empty.' });
  }

  try {
    const post = await db.send_sql(
      `SELECT user_ids_who_liked FROM posts WHERE post_id = ${postId}`
    );

    if (post.length === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: 'Post not found.' });
    }

    if (post[0].user_ids_who_liked === null) {
      return res
        .status(HTTP_STATUS.SUCCESS)
        .json({ liked: false });
    }

    const user_ids_who_liked = post[0].user_ids_who_liked.split(',');

    if (user_ids_who_liked.includes(String(user_id))) {
      return res
        .status(HTTP_STATUS.SUCCESS)
        .json({ liked: true });
    } else {
      return res
        .status(HTTP_STATUS.SUCCESS)
        .json({ liked: false });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}