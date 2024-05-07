const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration
const fs = require('fs');

function sendQueryOrCommand(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

async function create_tables(db) {
  // These tables should already exist from prior homeworks.
  // We include them in case you need to recreate the database.

  // You'll need to define the names table.
  // var qa = db.create_tables('...');

  // var qb = db.create_tables('CREATE TABLE IF NOT EXISTS titles ( \
  //   tconst VARCHAR(10) PRIMARY KEY, \
  //   titleType varchar(255), \
  //   primaryTitle VARCHAR(255), \
  //   originalTitle VARCHAR(255), \
  //   startYear varchar(4), \
  //   endYear varchar(4), \
  //   genres VARCHAR(255) \
  //   );')

  //   var qc = db.create_tables('CREATE TABLE IF NOT EXISTS principals ( \
  //     tconst VARCHAR(10), \
  //     ordering int, \
  //     nconst VARCHAR(10), \
  //     category VARCHAR(255), \
  //     job VARCHAR(255), \
  //     characters VARCHAR(255), \
  //     FOREIGN KEY (tconst) REFERENCES titles(tconst), \
  //     FOREIGN KEY (nconst) REFERENCES names(nconst_short) \
  //     );')

  //   var qd = db.create_tables('CREATE TABLE IF NOT EXISTS recommendations ( \
  //     person VARCHAR(10), \
  //     recommendation VARCHAR(10), \
  //     strength int, \
  //     FOREIGN KEY (person) REFERENCES names(nconst_short), \
  //     FOREIGN KEY (recommendation) REFERENCES names(nconst_short) \
  //     );')
  var q0 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS names ( \
      nconst VARCHAR(10) PRIMARY KEY, \
      primaryName VARCHAR(255), \
      birthYear VARCHAR(4), \
      deathYear VARCHAR(4) \
    );'
  );

  // TODO: create users table
  var q2 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS users ( \
      user_id INT NOT NULL AUTO_INCREMENT, \
      username VARCHAR(255) NOT NULL UNIQUE, \
      hashed_password VARCHAR(255) NOT NULL, \
      linked_nconst VARCHAR(10), \
      image_id VARCHAR(255), \
      first_name VARCHAR(255), \
      last_name VARCHAR(255), \
      email VARCHAR(255), \
      affiliation VARCHAR(255), \
      birthday DATE, \
      interests VARCHAR(255), \
      logged_in BOOLEAN DEFAULT FALSE, \
      PRIMARY KEY(user_id), \
      FOREIGN KEY(linked_nconst) REFERENCES names(nconst) \
    );'
  );

  var q1 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS friends ( \
      followed INT, \
      follower INT, \
      FOREIGN KEY (follower) REFERENCES users(user_id), \
      FOREIGN KEY (followed) REFERENCES users(user_id) \
    );'
  );

  // TODO: create posts table
  // var q3 = db.create_tables(
  //   'CREATE TABLE IF NOT EXISTS posts ( \
  //     post_id INT NOT NULL AUTO_INCREMENT, \
  //     parent_post INT, \
  //     title VARCHAR(255), \
  //     content VARCHAR(255), \
  //     author_id INT, \
  //     PRIMARY KEY(post_id), \
  //     FOREIGN KEY(parent_post) REFERENCES posts(post_id), \
  //     FOREIGN KEY(author_id) REFERENCES users(user_id) \
  //   );'
  // );

  // Create hashtag table
  var q3 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS hashtags ( \
      hashtag_id INT NOT NULL AUTO_INCREMENT, \
      name VARCHAR(255), \
      count INT, \
      PRIMARY KEY(hashtag_id) \
    );'
  );

  // Post table
  var q4 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS posts ( \
      post_id INT NOT NULL AUTO_INCREMENT, \
      author_id INT, \
      content VARCHAR(255), \
      image VARCHAR(255), \
      hashtag_ids VARCHAR(255), \
      user_ids_who_liked VARCHAR(255), \
      PRIMARY KEY(post_id), \
      FOREIGN KEY(author_id) REFERENCES users(user_id) \
    );'
  );


  // Comments table
  var q5 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS comments ( \
      comment_id INT NOT NULL AUTO_INCREMENT, \
      post_id INT, \
      author_id INT, \
      content VARCHAR(255), \
      hashtag_ids VARCHAR(255), \
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
      PRIMARY KEY(comment_id), \
      FOREIGN KEY(post_id) REFERENCES posts(post_id), \
      FOREIGN KEY(author_id) REFERENCES users(user_id) \
    );'
  );

  // Friend requests table
  var q6 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS friend_requests ( \
      recipient INT, \
      sender INT, \
      FOREIGN KEY (recipient) REFERENCES users(user_id), \
      FOREIGN KEY (sender) REFERENCES users(user_id) \
    );'
  );

  // Password reset table
  var q7 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS password_reset ( \
      user_id INT, \
      token VARCHAR(255), \
      FOREIGN KEY (user_id) REFERENCES users(user_id) \
    );'
  );

  return await Promise.all([q0, q1, q2, q3, q4, q5, q6]);
}

// Database connection setup
const db = dbaccess.get_db_connection();
console.log('Connected to database');

var result = create_tables(dbaccess);
console.log('Tables created');
//db.close_db();

// const populateNames = async function populateFriendsTable() {
//   const csvFilePath = '../data/names.csv';
//   const csvData = fs.readFileSync(csvFilePath, 'utf-8');

//   // Split CSV data by newlines and parse each line
//   const rows = csvData
//     .trim()
//     .split('\n')
//     .map((row) => row.split(','));

//   // Assuming the first row of the CSV contains column headers
//   const columns = rows.shift();

//   // Generate the INSERT query dynamically
//   let insertQuery = `INSERT INTO names (nconst, primaryName, birthYear, deathYear) VALUES `;
//   rows.forEach((row) => {
//     insertQuery += `('${row[3]}', '${row[0]}', '${row[1]}', '${row[2]}'),`;
//   });
//   insertQuery = insertQuery.slice(0, -1);
//   insertQuery += ';';
//   console.log('finished creating query');
//   try {
//     await dbaccess.insert_items(insertQuery);
//   } catch (e) {
//     console.log(e);
//     return;
//   }
//   console.log('finished adding items');
//   return;
// };


// populateNames();
// console.log("finished populating names");
const PORT = config.serverPort;
