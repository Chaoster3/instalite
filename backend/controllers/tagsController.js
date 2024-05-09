const dbsingleton = require('../access/db_access');
const HTTP_STATUS = require('../utils/httpStatus');
const db = dbsingleton;

exports.createTag = async (req, res) => {
  const { name } = req.body;

  if (name == null) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Name cannot be empty.' });
  }

  try {
    // Check if the tag already exists
    const tag = await db.send_sql(
      `SELECT * FROM hashtags WHERE name = '${name}'`
    );
    if (tag.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Tag already exists.' });
    }

    // Insert the tag
    await db.send_sql(
      `INSERT INTO hashtags (name, count) VALUES ('${name}', '1')`
    );
    return res.status(HTTP_STATUS.CREATED).json({ name: name });
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
}

exports.getAllTagNames = async (req, res) => {
  try {
    const tags = await db.send_sql(`SELECT name FROM hashtags`);
    return res.status(HTTP_STATUS.SUCCESS).json(tags);
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
}

exports.findTopTenTags = async (req, res) => {
  try {
    const tags = await db.send_sql(`SELECT * FROM hashtags ORDER BY count DESC LIMIT 10`);
    return res.status(HTTP_STATUS.SUCCESS).json(tags);
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
}

exports.updateUserHashTags = async (req, res) => {
  const { user_id } = req.session;
  const { hashtag_names } = req.body;

  if (user_id === null) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'User not logged in.' })
  }

  try {
    // Check if the user exists
    const user = await db.send_sql(
      `SELECT * FROM users WHERE user_id = '${user_id}'`
    );
    if (user.length == 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'User does not exist.' });
    }

    // Change the hastag_names into hashtag_ids
    const hashtag_ids = [];
    for (let i = 0; i < hashtag_names.length; i++) {
      const tag = await db.send_sql(
        `SELECT hashtag_id FROM hashtags WHERE name = '${hashtag_names[i]}'`
      );
      if (tag.length == 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Tag does not exist.' });
      }
      hashtag_ids.push(tag[0].hashtag_id);
    }

    console.log(hashtag_ids)

    const sql = `UPDATE users SET interests = '[${hashtag_ids}]' WHERE user_id = '${user_id}'`;
    console.log(sql)

    // Update the user's hashtags
    await db.send_sql(sql);
    return res.status(HTTP_STATUS.SUCCESS).json({ success: 'User hashtags updated successfully.' });
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
}

exports.searchHashTags = async (req, res) => {
  const { q } = req.params;

  try {
    const tags = await db.send_sql(
      `SELECT name FROM hashtags WHERE name LIKE '%${q}%'`
    );
    return res.status(HTTP_STATUS.SUCCESS).json(tags);
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
};


exports.getTagNameFromID = async (req, res) => {
  const { tagId } = req.params;

  try {
    const tag = await db.send_sql(
      `SELECT name FROM hashtags WHERE hashtag_id = '${tagId}'`
    );

    if (tag.length == 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Tag does not exist.' });
    }

    return res.status(HTTP_STATUS.SUCCESS).json(tag[0]);
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
}