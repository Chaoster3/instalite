const dbsingleton = require('../access/db_access.js');
const bcrypt = require('bcrypt');
const chroma = require('../basic-face-match-main/app.js');
const aws = require('aws-sdk');
const process = require('process');
const path = require('path');
const fs = require('fs');
const HTTP_STATUS = require('../utils/httpStatus');
const e = require('express');

const db = dbsingleton;

exports.register = async function (req, res) {
    console.log(req.body);
    const {
        username,
        password,
        firstName,
        lastName,
        email,
        affiliation,
        birthday,
        image_link,
        linked_nconst,
        interests,
        nconst_options,
    } = req.body;
    if (
        username == null ||
        password == null ||
        firstName == null ||
        lastName == null ||
        email == null ||
        affiliation == null ||
        birthday == null ||
        image_link == null ||
        linked_nconst == null ||
      interests == null ||
      nconst_options == null
    ) {
        console.log(username, password, firstName, lastName, email, affiliation, birthday, image_link, linked_nconst, interests, nconst_options);
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
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(hash);
                }
            });
        });
        await db.send_sql(
            `INSERT INTO users (username, hashed_password, first_name, last_name, email, affiliation, birthday, image_link, linked_nconst, interests, nconst_options) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username,hashed, firstName, lastName, email, affiliation, birthday, image_link, linked_nconst, JSON.stringify(interests), JSON.stringify(nconst_options)]
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

const s3 = new aws.S3({
    region: process.env.S3_REGION
});

// Note: Stores selfie in S3 and then returns 5 closest actors
exports.getClosest = async (req, res) => {
    console.log(req.body);
    const {
        username,
        password,
        firstName,
        lastName,
        email,
        affiliation,
        birthday,
    } = req.body;
    if (
        username == null ||
        password == null ||
        firstName == null ||
        lastName == null ||
        email == null ||
        affiliation == null ||
        birthday == null
    ) {
        return res.status(400).json({
            error:
                'One or more of the fields you entered was empty, please try again.',
        });
    }
    let count;
    try {
        const existing = await db.send_sql(
            `SELECT * FROM users WHERE username = '${username}'`
        );
        count = await db.send_sql(
            `SELECT COUNT(*) AS count FROM users`
        );
        if (existing.length > 0) {
            return res.status(409).json({
                error:
                    'An account with this username already exists, please try again.',
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database' });
    }

    const file = req.file;
    if (file == null) {
        return res.status(400).json({ error: 'No image uploaded' });
    }
    fs.readFile(file.path, (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error uploading file');
        } else {
            console.log(file.path);
            console.log(count);
            const key = username + count[0]['count'];
            const params = {
                Bucket: process.env.S3_BUCKET_1,
                Key: key,
                Body: data
            };
            const responseData = {};
            responseData.matches = [];
            // Upload the file to S3
            s3.upload(params, async (err, s3Data) => {
                if (err) {
                    console.error('Error uploading to S3:', err);
                    return res.status(500).send('Error uploading file');
                } else {
                    responseData.image_link = s3Data.Location;
                    try {
                        for (var item of await chroma.findTopKMatches(req.collection, file.path, 5)) {
                            for (var i = 0; i < item.ids[0].length; i++) {
                                console.log(item.documents[0][i].slice(0, -3));
                                const name = await db.send_sql(
                                    `SELECT primaryName FROM names WHERE nconst = '${item.documents[0][i].slice(0, -4)}'`
                                );
                                responseData['matches'].push({name: name[0]['primaryName'], image: item.documents[0][i]});
                            }
                        }
                        return res.status(200).json(responseData);
                    } catch (err) {
                        console.log(err);
                        return res.status(500).json({ error: 'Error with ChromaDB' });
                    }
                }
            });
        }
    });
};

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
       WHERE friends.follower = '${user_id}'`
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
      `SELECT users.username AS username, posts.content AS content, posts.post_id AS post_id, posts.hashtag_ids AS hashtag_ids
       FROM posts
        JOIN users ON posts.author_id = users.user_id
      WHERE posts.author_id = '${user_id}'`
    );

    const friendsPosts = await db.send_sql(
      `SELECT users.username AS username, posts.content AS content, posts.post_id AS post_id, posts.hashtag_ids AS hashtag_ids
      FROM posts
        JOIN users ON posts.author_id = users.user_id
      WHERE author_id IN (SELECT followed from friends WHERE follower = '${user_id}')`
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

exports.getFriendRequests = async (req, res) => {
    const { user_id } = req.session;

    if (user_id == null) {
        return res
            .status(HTTP_STATUS.UNAUTHORIZED)
            .json({ error: 'You must be logged in to see your friend requests.' });
    }

    try {
        const info = await db.send_sql(
            `SELECT users.username AS username
            FROM friend_requests
            JOIN users ON friend_requests.sender = users.user_id
            WHERE friend_requests.recipient = '${user_id}'`
        );
        console.log(info);
        return res.status(HTTP_STATUS.SUCCESS).json(info);
    } catch (err) {
        console.log(err);
        return res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .json({ error: 'Error querying database.' });
    }
}

exports.sendFriendRequest = async (req, res) => {
    const { user_id } = req.session;
    const { recipient_username } = req.body;

    if (user_id == null) {
        return res
            .status(HTTP_STATUS.UNAUTHORIZED)
            .json({ error: 'You must be logged in to send a friend request.' });
    }

    if (recipient_username == null) {
        return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json({ error: 'Friend username cannot be empty.' });
    }

    try {
        const info = await db.send_sql(
            `SELECT user_id FROM users WHERE username = '${recipient_username}'`
        );
        if (info.length == 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({error: 'Username does not exist'});
        } else {
            console.log(info);
            const friend_id = info[0].user_id;
            const p1 = db.send_sql(
                `SELECT * FROM friends WHERE follower = '${user_id}' AND followed = '${friend_id}'`
            );
            const p2 = db.send_sql(
                `SELECT * FROM friend_requests WHERE sender = '${user_id}' AND recipient = '${friend_id}'`
            );
            [check1, check2] = await Promise.all([p1, p2]);
            if (check1.length > 0) {
                return res
                    .status(HTTP_STATUS.CONFLICT)
                    .json({ error: 'You are already friends with this user.' });
            }
            if (check2.length > 0) {
                return res
                  .status(HTTP_STATUS.CONFLICT)
                  .json({ error: 'A friend request to this user is already pending.' });
            } else {
              await db.send_sql(
                `INSERT INTO friend_requests (recipient, sender) VALUES (${friend_id}, ${user_id})`
              );
              return res
                .status(HTTP_STATUS.SUCCESS)
                .json({ success: 'Friend added successfully.' });
            }
        }
    } catch (err) {
        console.log(err);
        return res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .json({ error: 'Error querying database.' });
    }
}

exports.declineRequest = async (req, res) => {
    const { user_id } = req.session;
    const { sender_username } = req.body;
    console.log('hi');
    if (user_id == null) {
        return res
            .status(HTTP_STATUS.UNAUTHORIZED)
            .json({ error: 'You must be logged in to send a friend request.' });
    }

    if (sender_username == null) {
        return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json({ error: 'Sender cannot be empty.' });
    }

    try {
        const info = await db.send_sql(
            `SELECT user_id FROM users WHERE username = '${sender_username}'`
        );
        if (info.length == 0) {
            return res
                .status(HTTP_STATUS.BAD_REQUEST)
                .json({ success: 'Username does not exist.' });
        } else {
            const sender_id = info[0].user_id;
            const check = await db.send_sql(
                `SELECT * FROM friend_requests WHERE sender = '${sender_id}' AND recipient = '${user_id}'`
            );
            if (check.length == 0) {
                return res
                    .status(HTTP_STATUS.BAD_REQUEST)
                    .json({ error: 'Attempting to decline a request that does not exist.' });
            } else {
                await db.send_sql(
                    `DELETE FROM friend_requests WHERE sender = '${sender_id}' AND recipient = '${user_id}'`
                );
                return res
                    .status(HTTP_STATUS.SUCCESS)
                    .json({ success: 'Friend request declined successfully.' });
            }
        }
    } catch (err) {
        console.log(err);
        return res
            .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
            .json({ error: 'Error querying database.' });
    }
}

exports.acceptRequest = async (req, res) => {
  const { user_id } = req.session;
  const { sender_username } = req.body;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to send a friend.' });
  }

  if (sender_username == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Sender cannot be empty.' });
  }

  try {
    const info = await db.send_sql(
      `SELECT user_id FROM users WHERE username = '${sender_username}'`
    );
    if (info.length == 0) {
        return res
            .status(HTTP_STATUS.BAD_REQUEST)
            .json({ success: 'Username does not exist.' });
    } else {
        const friend_id = info[0].user_id;
        const check = await db.send_sql(
            `SELECT * FROM friend_requests WHERE sender = '${friend_id}' AND recipient = '${user_id}'`
        );
        if (check.length > 0) {
            const p1 = db.send_sql(
                `INSERT INTO friends (follower, followed) VALUES (${user_id}, ${friend_id}), (${friend_id}, ${user_id})`
            );
            const p2 = db.send_sql(
                `DELETE FROM friend_requests WHERE (sender = ${friend_id} AND recipient = ${user_id}) OR (sender = ${user_id} AND recipient = ${friend_id})`
            );
            await Promise.all([p1, p2]);
            const remover1 = await db.send_sql(`SELECT friend_recommendation from users WHERE user_id = '${user_id}'`);
            const a1 = remover1[0].friend_recommendation;
            if (a1) {
              a2 = JSON.parse(a1);
              a2[friend_id] = null;
              a3 = JSON.stringify(a2);
              await db.send_sql(`UPDATE users SET friend_recommendation =  ? WHERE user_id = ?`, [a3, user_id]);
            }
            const remover2 = await db.send_sql(`SELECT friend_recommendation from users WHERE user_id = '${friend_id}'`);
            const b1 = remover2[0].friend_recommendation;
            if (b1) {
              b2 = JSON.parse(b1);
              b2[user_id] = null;
              b3 = JSON.stringify(b2);
              await db.send_sql(`UPDATE users SET friend_recommendation =  ? WHERE user_id = ?`, [b3, friend_id]);
            }
            return res
                .status(HTTP_STATUS.SUCCESS)
                .json({ success: 'Friend added successfully.' });
        } else {
            return res
                .status(HTTP_STATUS.UNAUTHORIZED)
                .json({ error: 'You can only add friends you have recieved friend requests from.' });
        }
    }
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.acceptRequest = async (req, res) => {
  const { user_id } = req.session;
  const { sender_username } = req.body;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to send a friend.' });
  }

  if (sender_username == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Sender cannot be empty.' });
  }

  try {
    const info = await db.send_sql(
      `SELECT user_id FROM users WHERE username = '${sender_username}'`
    );
    if (info.length == 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ success: 'Username does not exist.' });
    } else {
      const friend_id = info[0].user_id;
      const check = await db.send_sql(
        `SELECT * FROM friend_requests WHERE sender = '${friend_id}' AND recipient = '${user_id}'`
      );
      if (check.length > 0) {
        const p1 = db.send_sql(
          `INSERT INTO friends (follower, followed) VALUES (${user_id}, ${friend_id}), (${friend_id}, ${user_id})`
        );
        const p2 = db.send_sql(
          `DELETE FROM friend_requests WHERE (sender = ${friend_id} AND recipient = ${user_id}) OR (sender = ${user_id} AND recipient = ${friend_id})`
        );
        await Promise.all([p1, p2]);
        return res
          .status(HTTP_STATUS.SUCCESS)
          .json({ success: 'Friend added successfully.' });
      } else {
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json({ error: 'You can only add friends you have recieved friend requests from.' });
      }
    }
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}

exports.removeFriend = async (req, res) => {
  const { user_id } = req.session;
  const { friendId } = req.body;
  console.log(friendId);
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
    //// TODO: Might need to go both ways
    const p1 = db.send_sql(`DELETE FROM friends WHERE follower = '${user_id}' AND followed = '${friendId}'`);
    const p2 = db.send_sql(`DELETE FROM friends WHERE followed = '${user_id}' AND follower = '${friendId}'`);
    await Promise.all([p1, p2]);
    console.log('reach')
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
      `SELECT * FROM users WHERE username = '${username}'`
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
      `SELECT username FROM users WHERE user_id = '${userId}'`
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

  // try {
  //   const currentFriends = await db.send_sql(
  //     `SELECT followed FROM friends WHERE follower = ${user_id}`
  //   );

  //   const friendOfFriends = await db.send_sql(`
  //     SELECT DISTINCT f2.followed AS followed
  //     FROM friends f1
  //       JOIN friends f2 ON f1.followed = f2.follower
  //     WHERE f1.follower = ${user_id} AND f2.followed <> ${user_id}
  //   `);

  //   // Select people from friendOfFriends that aren't in currentFriends
  //   const friends = currentFriends.map(friend => friend.followed);
  //   const users = friendOfFriends.map(friend => friend.followed);

  //   var friendRecommendationIds = users.filter(user => !friends.includes(user));

  //   // Get the usernames of the friend recommendations
  //   var friendRecommendation = [];
  //   for (let i = 0; i < friendRecommendationIds.length; i++) {
  //     const username = await db.send_sql(
  //       `SELECT username, user_id FROM users WHERE user_id = ${friendRecommendationIds[i]}`
  //     );
  //     friendRecommendation.push(username[0]);
  //   }
    try {
      let friendRecommendation = [];
      const recs = await db.send_sql(
        `SELECT friend_recommendation FROM users WHERE user_id = ${user_id}`
      );
      if (recs[0].friend_recommendation) {
        const parsed = Object.entries(JSON.parse(recs[0].friend_recommendation));
        parsed.sort((a, b) => a[1] - b[1]);
        friendRecommendation = entries.slice(0, 5).map(entry => entry[0]);
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
    console.log("hello");
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