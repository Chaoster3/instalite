const dbsingleton = require('../access/db_access.js');
const bcrypt = require('bcrypt');
const chroma = require('../basic-face-match-main/app.js');
const aws = require('aws-sdk');
const process = require('process');
const path = require('path');
const fs = require('fs');


const db = dbsingleton;

exports.register = async function (req, res) {
    const {
        username,
        password,
        firstName,
        lastName,
        email,
        affiliation,
        birthday,
        uri,
        actor,
        actor_id
    } = req.body;
    if (
        username == null ||
        password == null ||
        firstName == null ||
        lastName == null ||
        email == null ||
        affiliation == null ||
        birthday == null ||
        uri == null ||
        actor == null ||
        actor_id == null
    ) {
        return res.status(400).json({
            error:
                'One or more of the fields you entered was empty, please try again.',
        });
    }
    try {
        const existing = await db.send_sql(
            `SELECT * FROM users WHERE username = '${username}'`
        );
        if (existing.length > 0) {
            return res.status(409).json({
                error:
                    'An account with this username already exists, please try again.',
            });
        }
        const hashed = await new Promise((resolve, reject) => {
            bscrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(hash);
                }
            });
        });
        await db.send_sql(
            `INSERT INTO users (username, password, firstName, lastName, email, affiliation, birthday, uri, actor, actor_id) VALUES ('${username}', '${hashed}', '${firstName}', '${lastName}', '${email}', '${affiliation}', '${birthday}', '${uri}', '${actor}', '${actor_id}')`
        );
        const found = await db.send_sql(
            `SELECT user_id FROM users WHERE username = '${username}'`
        );
        req.session.user_id = found[0]['user_id'];
        req.session.username = username;
        return res.status(200).json({ username: username });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
};

exports.login = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username == null || password == null) {
        return res.status(400).json({
            error:
                'One or more of the fields you entered was empty, please try again.',
        });
    }
    try {
        const correct = await db.send_sql(
            `SELECT password, user_id FROM users WHERE username = '${username}'`
        );
        let matches;
        if (correct.length < 1) {
            matches = false;
        } else {
            matches = await new Promise((resolve, reject) => {
                bcrypt.compare(
                    password,
                    correct[0]['password'],
                    (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    }
                );
            });
        }
        if (correct.length < 1 || !matches) {
            return res
                .status(401)
                .json({ error: 'Username and/or password are invalid.' });
        } else {
            req.session.user_id = correct[0]['user_id'];
            req.session.username = username;
            return res.status(200).json({ username: username });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database' });
    }
};

exports.logout = (req, res) => {
    // TODO: fill in log out logic to disable session info
    req.session.user_id = null;
    req.session.username = null;
    return res.status(200).json({ message: 'You were successfully logged out.' });
};

exports.changePassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const { user_id } = req.session;

    if (newPassword == null || confirmPassword == null) {
        return res.status(400).json({ error: 'One or more fields were empty.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        const hashed = await new Promise((resolve, reject) => {
            bcrypt.hash(newPassword, 10, (err, hash) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(hash);
                }
            });
        });
        await db.send_sql(
            `UPDATE users SET password = '${hashed}' WHERE user_id = ${user_id}`
        );
        return res.status(200).json({ success: 'Password changed successfully.' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

exports.changeEmail = async (req, res) => {
    const { email } = req.body;
    const { user_id } = req.session;

    if (email == null) {
        return res.status(400).json({ error: 'Email cannot be empty.' });
    }

    try {
        await db.send_sql(
            `UPDATE users SET email = '${email}' WHERE user_id = ${user_id}`
        );
        return res.status(200).json({ success: 'Email changed successfully.' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

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

exports.getClosest = async (req, res) => {
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
      `SELECT followed FROM friends WHERE follower = ${user_id}`
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
      `SELECT * FROM posts WHERE user_id = ${user_id}`
    );

    const friendsPosts = await db.send_sql(
      `SELECT * FROM posts WHERE user_id IN (SELECT followed FROM friends WHERE follower = ${user_id})`
    );

    const posts = yourPosts.concat(friendsPosts);

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