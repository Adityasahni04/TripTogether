const express = require("express");
const app = express();
const path = require("path");
const db = require("./database");


app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(9090, () => {
    console.log(`Server is listening on port 9090`);
});
