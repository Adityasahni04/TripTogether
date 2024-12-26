const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const { authMiddleware, generateToken, checkForAuth } = require('./services/auth');
const User = require("./models/user");  
const path = require("path");
const bodyparser = require("body-parser");
require('./database');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());


app.get('/', async (req, res) => {    
     res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.get('/verify',async(req,res)=>{
    const token = req.cookies.token;
    console.log(token);
    if (!token) {
        return res.sendFile(path.join(__dirname, "public", "signup.html"));
    }
    try {
        const userPayload = await authMiddleware(token);
        if (userPayload) {
            return res.sendFile(path.join(__dirname, "public", "main.html"));
        }
    } catch (error) {
        console.error('Token validation failed:', error);
        return res.sendFile(path.join(__dirname, "public", "index.html"));
    }
})

app.post('/newuser', async (req, res) => {
    const data = req.body;
    console.log(data);
    const newuser = new User(data);
    
    try {
        // Save the new user and generate the token
        await newuser.save();
        
        const tokenData = {
            Email: newuser.Email,
            Password: newuser.Password,
            Name: newuser.Name,
        };
        
        const token = await generateToken(tokenData); // Ensure token is awaited
        
        console.log(token);
        res.cookie("token", token).status(200).redirect("/verify"); // Redirect to homepage after registration
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).send('Server error');
    }
});

app.post('/loginuser', async (req, res) => {
    const data = req.body;

    try {
        const user = await User.findOne({ Email: data.Email });

        if (!user) {
            return res.send("User does not exist");
        }
        
        const isMatch = await user.comparePass(data.Password); // Ensure comparison is awaited

        if (isMatch) {
            const tokenData = {
                Email: user.Email,
                Password: user.Password,
                Name: user.Name,
            };
            
            const token = await generateToken(tokenData); // Ensure token is awaited
            res.cookie("token", token).status(200).redirect('/verify'); // Redirect to homepage after successful login
        } else {
            res.send("Password is incorrect");
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send("Server error");
    }
});
app.get('/logout',(req,res)=>{
        res.clearCookie("token").redirect("/");
})

app.listen(9000, () => {
    console.log(`Server is listening on port 9090`);
});
