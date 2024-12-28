const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const { authMiddleware, generateToken, checkForAuth } = require('./services/auth');
const User = require("./models/user");
const Group = require("./models/group"); // Ensure Group model is imported
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

app.get('/verify', async (req, res) => {
    const token = req.cookies.token;
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
        return res.sendFile(path.join(__dirname, "public", "signup.html"));
    }
});

app.post('/newuser', async (req, res) => {
    const data = req.body;
    const newuser = new User(data);
    
    try {
        await newuser.save();
        const tokenData = { Email: newuser.Email,PhoneNumber:newuser.PhoneNumber, Password: newuser.Password, Name: newuser.Name };
        const token = await generateToken(tokenData);
        res.cookie("token", token).status(200).redirect("/verify");
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).send('Server error');
    }
});

app.post('/loginuser', async (req, res) => {
    const data = req.body;

    try {
        const user = await User.findOne({ Email: data.Email });
        if (!user) return res.send("User does not exist");

        const isMatch = await user.comparePass(data.Password);
        if (isMatch) {
            const tokenData = { Email: user.Email,PhoneNumber:user.PhoneNumber,Password: user.Password, Name: user.Name };
            const token = await generateToken(tokenData);
            res.cookie("token", token).status(200).redirect('/verify');
        } else {
            res.send("Password is incorrect");
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send("Server error");
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie("token").redirect("/");
});

// Add Group API
app.post('/addGroup',checkForAuth('token'),async (req, res) => {
    console.log("req come")
    const { name, description, location } = req.body;
    const user = req.user;
    console.log(user); // From checkForAuth middleware

    try {
        const newGroup = new Group({
            name,
            description,
            location,
            createdBy: user.PhoneNumber, // Using PhoneNumber as the unique ID
            members: [{phoneNumber: user.PhoneNumber, role: 'admin' }] // Admin is the creator
        });
        await newGroup.save();
        res.status(201).send({ message: "Group created successfully", group: newGroup });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).send("Server error");
    }
});

app.delete('/deleteGroup', checkForAuth('token'), async (req, res) => {
    const { groupId } = req.body;
    const user = req.user; // From checkForAuth middleware
    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Compare PhoneNumber with createdBy field
        if (group.createdBy !== user.PhoneNumber) {
            return res.status(403).json({ message: "Only the group creator can delete the group" });
        }

        await group.deleteOne();
        res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ message: "Server error" });
    }
});



// Join Group API
app.post('/joinGroup',checkForAuth('token'), async (req, res) => {
    console.log("request comes in server");
    const { groupId } = req.body;
    const user = req.user; // From checkForAuth middleware

    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });
    
        // Check if the user is already a member
        const isMember = group.members.some(member => member.phoneNumber === user.PhoneNumber);
        console.log(isMember);
        if (isMember) return res.status(400).json({ message: "User is already a member of the group" });
    
        // Add the user to the group as a member
        group.members.push({ phoneNumber: user.PhoneNumber, role: 'member' });
        await group.save();
        res.status(200).json({ message: "Joined group successfully", group });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ message: "Server error" });
    }    
});
app.post('/leaveGroup', checkForAuth('token'), async (req, res) => {
    const { groupId } = req.body;
    const user = req.user;
    console.log(user); // User info from checkForAuth middleware

    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Check if the user is a member of the group
        const userIndex = group.members.findIndex(member => member.phoneNumber === user.PhoneNumber);
        if (userIndex === -1) return res.status(400).json({ message: "User is not a member of this group" });

        const isAdmin = group.members[userIndex].role === 'admin';

        // Prevent the last admin from leaving the group
        if (isAdmin && group.members.filter(member => member.role === 'admin').length === 1) {
            return res.status(400).json({ message: "Cannot leave the group, you are the only admin" });
        }

        // Remove the user from the group
        group.members.splice(userIndex, 1);
        await group.save();
        res.status(200).json({ message: "Successfully left the group", group });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get('/groups', async (req, res) => {
    try {
        const groups = await Group.find({}, '_id name description location'); // Fetch groups with required fields
        res.status(200).send(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).send({ message: 'Error fetching groups' });
    }
});

app.post("/api/check-group-membership", checkForAuth('token'), async (req, res) => {
    console.log("request comes");
    const { firstLine } = req.body;
    console.log(firstLine);
    const user = req.user;
  
    if (!firstLine) {
        console.log("error");
        return res.status(400).json({ message: "Group name is required" });
    }
  
    try {
        console.log("i am in try");
        const group = await Group.findOne({ name: firstLine });
        console.log(group);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
    
        console.log(user.PhoneNumber)
        const isMember = group.members.some(member => member.phoneNumber === user.PhoneNumber);
        console.log(isMember);
        return res.json({ isMember });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});  
app.listen(9000, () => {
    console.log(`Server is listening on port 9000`);
});
