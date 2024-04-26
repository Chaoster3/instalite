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
            return res.status(404).json({ error: 'User not found.' });
        }

        await db.send_sql(
            `UPDATE users SET img_id = ${img_id} WHERE user_id = ${user_id}`
        );
        return res.status(200).json({ success: 'Actor changed successfully.' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

exports.getClosest = async (req, res) => {
    const { user_id } = req.session;

    // Find the actor_id associated with the current user
    try {
        const actor_id = await db.send_sql(
            `SELECT actor_id FROM users WHERE user_id = ${user_id}`
        );
        if (actor.length === 0) {
            return res.status(404).json({ error: 'Actor not found.' });
        }

        //// TODO: Find the 5 closest embeddings
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

const s3 = new aws.S3({
    region: process.env.S3_REGION
});

exports.getClosest = async (req, res) => {
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
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error querying database' });
    }

    const file = req.file;
    // Read the file from disk
    fs.readFile(file.path, (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error uploading file');
        } else {
            console.log(file.path);
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: username,
                Body: data
            };
            const responseData = {};
            // Upload the file to S3
            s3.upload(params, async (err, s3Data) => {
                if (err) {
                    console.error('Error uploading to S3:', err);
                    return res.status(500).send('Error uploading file');
                } else {
                    responseData.uri = s3Data.Location;
                    try {
                        for (var item of await chroma.findTopKMatches(req.collection, file.path, 5)) {
                            for (var i = 0; i < item.ids[0].length; i++) {
                                console.log(item.documents[0][i].slice(0, -3));
                                const name = await db.send_sql(
                                    `SELECT primaryName FROM names WHERE nconst = '${item.documents[0][i].slice(0, -4)}'`
                                );
                                console.log(name);
                                responseData[i] = [name[0]['primaryName'],item.documents[0][i]];
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