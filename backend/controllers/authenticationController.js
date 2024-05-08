const bcrypt = require('bcrypt');
const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const nodemailer = require('nodemailer');
var config = require('../config.json');


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
    interestNames,
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

    const hashed = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });

    // Convert interest names into interest ids
    const interestIds = [];
    for (let i = 0; i < interestNames.length; i++) {
      const interest = await db.send_sql(
        `SELECT * FROM hashtags WHERE name = '${interestNames[i]}'`
      );
      if (interest.length === 0) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ error: `Interest ${interestNames[i]} does not exist.` });
      }
      interestIds.push(interest[0].hashtag_id);
    }

    await db.send_sql(
      `INSERT INTO users (username, hashed_password, first_name, last_name, email, affiliation, birthday, linked_nconst, interests) VALUES ('${username}', '${hashed}', '${firstName}', '${lastName}', '${email}', '${affiliation}', '${birthday}', '${linked_nconst}', '${interestIds}')`
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
      // User succcessfully logs in
      req.session.user_id = correct[0]['user_id'];
      req.session.username = username;
      await req.session.save();

      // Update the logged in field in the user db
      await db.send_sql(
        `UPDATE users SET logged_in = 1 WHERE user_id = ${req.session.user_id}`
      );
      return res.status(HTTP_STATUS.SUCCESS).json({ username: username });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database' });
  }
};

exports.logout = async function (req, res) {
  try {
    // Update the logged in field in the user db
    await db.send_sql(
      `UPDATE users SET logged_in = 0 WHERE user_id = ${req.session.user_id}`
    );
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database' });
  }

  req.session.user_id = null;
  req.session.username = null;
  await req.session.save();

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

// Checks if the user is signed in
exports.checkIfLoggedIn = async (req, res) => {
  //console.log(req.session);
  //console.log(req.session.user_id);
  if (req.session && req.session.user_id) {
    return res.status(HTTP_STATUS.SUCCESS).json({ data: req.session.username });
  } else {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ data: false });
  }
}

exports.getResetLink = async (req, res) => {
  const username = req.query.username;
  console.log(username);
  try {
    const info = await db.send_sql(
      `SELECT user_id, email FROM users WHERE username = '${username}'`
    );
    if (info.length > 0) {
      const user_id = info[0]['user_id'];
      const email = info[0]['email'];
      const token = Math.random().toString(36).substring(2);
      await db.send_sql(
        `INSERT INTO password_reset (user_id, token) VALUES (${user_id}, '${token}')`
      );
      let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: config.email,
          pass: config.email_password
        }
      });
      const reset_link = config.website + "resetPassword/" + token;
      let mailOptions = {
        from: '"MOG" <Myelin.Oglio.Glyco@gmail.com>',
        to: email,
        subject: 'Password Reset',
        html: `Click <a href="${reset_link}">here</a> to reset your password.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          throw new Error('Error sending email');
        }
      });
    }
    return res
      .status(HTTP_STATUS.SUCCESS)
      .json({ success: 'Reset password link emailed.' });
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error sending email.' });
  }
}

exports.resetPassword = async (req, res) => {
  const { password, confirmPassword, token } = req.body;
  console.log(req.body);
  if (password == null) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Password cannot be empty.' });
  };
  if (password != confirmPassword) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: 'Passwords must match.' });
  }
  try {
    const info = await db.send_sql(
      `SELECT user_id FROM password_reset WHERE token = '${token}'`
    );
    console.log(info)
    if (info.length == 0) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: 'Invalid reset link' });
    } else {
      const user_id = info[0]['user_id'];
      const hashed = await new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        });
      });
      const q1 = db.send_sql(
        `UPDATE users SET hashed_password = '${hashed}' WHERE user_id = '${user_id}'`
      );
      const q2 = db.send_sql(
        `DELETE FROM password_reset WHERE token = '${token}'`
      );
      await Promise.all([q1, q2]);
      return res
        .status(HTTP_STATUS.SUCCESS)
        .json({ success: 'Password has been reset.' });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error querying database.' });
  }
}