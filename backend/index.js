const express = require('express');
const routes = require('./routes');

const app = express();
app.use(express.json());


app.get("/", (req, res) => {
  res.send("test");
})



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
