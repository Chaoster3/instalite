const express = require('express');
const routes = require('./controllers/userController');
const app = require('./app');
app.use(express.json());


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
