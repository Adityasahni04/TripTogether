const express = require("express");
const app = express();
const User=require("./modlues/user")
const path = require("path");
const bodyparser=require("body-parser");
const db = require("./database");

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.post('/newuser',async(req,res)=>{
    const data = req.body;
    const newuser=new User(data);
    await newuser.save();
     console.log(data);
     res.send("User recived")
})

app.post('/loginuser', async (req, res) => {
    const data = req.body;

    try {
        const user = await User.findOne({ Email: data.Email });

        if (!user) {
            return res.send("User does not exist");
        }

        // Use the instance method comparePass on the found user instance
        const isMatch = await user.comparePass(data.Password); 

        if (isMatch) {
            res.sendFile(path.join(__dirname, "public", "index.html"));
        } else {
            res.send("Password is incorrect");
        }
    } catch (err) {
        res.status(500).send("Server error");
    }
});

app.listen(9090, () => {
    console.log(`Server is listening on port 9090`);
});