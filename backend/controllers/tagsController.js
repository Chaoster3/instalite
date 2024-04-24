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
    return res.status(HTTP_STATUS.SUCCESS).json({ success: 'Tag created successfully.' });
  } catch (err) {
    console.log(err);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error querying database.' });
  }
}

exports.getAllTags = async (req, res) => {
  try {
    const tags = await db.send_sql(`SELECT * FROM hashtags`);
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