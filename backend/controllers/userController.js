const dbsingleton = require('../models/db_access.js');
const bcrypt = require('bcrypt');
const dbsingleton = require('../access/db_access.js');

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
      `INSERT INTO users (username, password, firstName, lastName, email, affiliation, birthday) VALUES ('${username}', '${hashed}', '${firstName}', '${lastName}', '${email}', '${affiliation}', '${birthday}')`
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
