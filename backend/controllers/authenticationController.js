const bcrypt = require('bcrypt');
const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const db = dbsingleton;

exports.register = async function (req, res) {
  const {
    username,
    password,
    passwordConfirm,
    firstName,
    lastName,
    email,
    affiliation,
    birthday,
    linked_nconst,
  } = req.body;
  console.log(req);

  if (
    username == null ||
    password == null ||
    passwordConfirm == null ||
    firstName == null ||
    lastName == null ||
    email == null ||
    affiliation == null ||
    birthday == null
  ) {
    console.log('one or more fields were empty');
    // print everything
    console.log(username);
    console.log(password);
    console.log(passwordConfirm)
    console.log(firstName)
    console.log(lastName)
    console.log(email)
    console.log(affiliation)
    console.log(birthday)
    console.log(linked_nconst)
    return res.status(400).json({
      error:
        'One or more of the fields you entered was empty, please try again.',
    });
  }

  if (password !== passwordConfirm) {
    console.log('passwords do not match')
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Passwords do not match, please try again.',
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

// A "forgot password" option that sends to the user's email address a password reset token and a link to the password reset screen;
exports.resetPassword = async (req, res) => {
  return res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ error: "Haven't implemented." });
}