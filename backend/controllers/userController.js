const bcrypt = require('bcrypt');
const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
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
    linked_nconst,
  } = req.body;

  if (
    username == null ||
    password == null ||
    firstName == null ||
    lastName == null ||
    email == null ||
    affiliation == null ||
    birthday == null ||
    linked_nconst == null
  ) {
    res.status(400).json({
      error:
        'One or more of the fields you entered was empty, please try again.',
    });
  }

  try {
    const existing = await db.send_sql(
      `SELECT * FROM users WHERE username = '${username}'`
    );

    if (existing.length > 0) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        error:
          'An account with this username already exists, please try again.',
      });
    }

    console.log('hashing password');

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
      `INSERT INTO users (username, hashed_password, first_name, last_name, email, affiliation, birthday, linked_nconst) VALUES ('${username}', '${hashed}', '${firstName}', '${lastName}', '${email}', '${affiliation}', '${birthday}', '${linked_nconst}')`
    );

    return res.status(HTTP_STATUS.CREATED).json({ username: username });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
};

exports.login = async function (req, res) {
  const { username, password } = req.body;

  if (username == null || password == null) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error:
        'One or more of the fields you entered was empty, please try again.',
    });
  }
  try {
    const correct = await db.send_sql(
      `SELECT hashed_password, user_id FROM users WHERE username = '${username}'`
    );

    let matches;
    if (correct.length < 1) {
      matches = false;
    } else {
      matches = await new Promise((resolve, reject) => {
        bcrypt.compare(
          password,
          correct[0]['hashed_password'],
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
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: 'Username and/or password are invalid.' });
    } else {
      req.session.user_id = correct[0]['user_id'];
      req.session.username = username;
      return res.status(HTTP_STATUS.SUCCESS).json({ username: username });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database' });
  }
};

exports.logout = (req, res) => {
  // TODO: fill in log out logic to disable session info
  req.session.user_id = null;
  req.session.username = null;
  return res
    .status(HTTP_STATUS.SUCCESS)
    .json({ message: 'You were successfully logged out.' });
};

exports.changePassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to change your password.' });
  }

  if (newPassword == null || confirmPassword == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'One or more fields were empty.' });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Passwords do not match.' });
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
      `UPDATE users SET hashed_password = '${hashed}' WHERE user_id = ${user_id}`
    );
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Password changed successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
};

exports.changeEmail = async (req, res) => {
  const { email } = req.body;
  const { user_id } = req.session;

  if (user_id == null) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: 'You must be logged in to change your password.' });
  }

  if (email == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Email cannot be empty.' });
  }

  try {
    await db.send_sql(
      `UPDATE users SET email = '${email}' WHERE user_id = ${user_id}`
    );
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Email changed successfully.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
};

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
