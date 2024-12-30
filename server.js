const express = require("express");
const cookieParser = require('cookie-parser');
const http = require("http");
const { Server } = require("socket.io");
const { authMiddleware, generateToken, checkForAuth } = require('./services/auth');
const User = require("./models/user");
const Group = require("./models/group");
const Message = require("./models/messages"); // Ensure Group model is imported
const path = require("path");
const bodyparser = require("body-parser");
require('./database');
const app = express();
const server = http.createServer(app);
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());



const io = new Server(server, {
    cors: {
      origin: "http://localhost:9000", // Replace with your client URL
      methods: ["GET", "POST"],
    },
  });
  
  
//socket.io 
io.on("connection", (socket) => {
    console.log("A user connected");

    // Join a specific group room
    socket.on("joinGroup", (groupId) => {
        console.log(groupId);
        socket.join(groupId);
        console.log(`User joined group: ${groupId}`);
    });

    // Listen for new messages
    socket.on("sendMessage", async (data) => {
        const { groupId, userId, message } = data;
        
        // Input validation
        if (!groupId || !userId || !message) {
            return socket.emit("error", "Missing required fields");
        }

        try {
            // Save the message in the database
            const newMessage = new Message({ groupId, userId, message });
            await newMessage.save();
            console.log("newMessage:", newMessage);
            await sendToGroup(groupId, "newMessage", newMessage);
        } catch (error) {
            console.error("Error saving message:", error);
            socket.emit("error", "Error saving message");
        }
    });
    const sendToGroup = async (groupID, event, data) => {
        const roomSockets = await io.in(groupID).fetchSockets(); // Fetch all sockets in the room
        if (roomSockets.length === 0) {
            console.error(`No users connected to the room: ${groupID}`);
            return;
        }
    
        console.log(`Sending event "${event}" to group "${groupID}"`);
        roomSockets.forEach((socket) => {
            socket.emit(event, data);
        });
    };
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

//socket.io ends here


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
    const {  groupName } = req.body;
    const user = req.user; // From checkForAuth middleware
    try {
        const group = await Group.findOne({ name: groupName });
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
    const { groupName } = req.body;
    const user = req.user;
    try {
        const group = await Group.findOne({ name: groupName });
        if (!group) return res.status(404).json({ message: "Group not found" });

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

app.get('/groups', checkForAuth('token'), async (req, res) => {
    try {
        const user = req.user; 
        const groups = await Group.find({}, '_id name description location members'); // Fetch groups with members
        // Check if the user is a member or admin of each group
        const userGroups = groups.map(group => {
            const isMemberOrAdmin = group.members.some(member => member.phoneNumber === user.PhoneNumber && (member.role === 'member' || member.role === 'admin'));
            return {
                ...group.toObject(),
                isMemberOrAdmin // Add a flag to indicate if the user is a member or admin
            };
        });
        res.status(200).send(userGroups); // Send groups with isMemberOrAdmin flag
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).send({ message: 'Error fetching groups' });
    }
});


app.post("/api/check-group-membership", checkForAuth('token'), async (req, res) => {
    const { firstLine } = req.body;
    const user = req.user; // Assuming req.user is populated by checkForAuth middleware

    if (!firstLine) {
        console.log("Group name not provided");
        return res.status(400).json({ message: "Group name is required" });
    }

    try {
        const group = await Group.findOne({ name: firstLine });

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Find the index of the user in the members array
        const userIndex = group.members.findIndex(member => member.phoneNumber === user.PhoneNumber);
        const isMember = userIndex !== -1; // If index is not -1, the user is a member
        const isAdmin = isMember && group.members[userIndex].role === 'admin';

        return res.json({ isMember, isAdmin });
    } catch (error) {
        console.error("Server error:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});


app.get("/api/get-messages/:groupId", async (req, res) => {
    console.log("request has come form api server");
    const { groupId } = req.params;
    console.log("Api:Get"+groupId);
    try {
        const messages = await Message.find({ groupId }).sort({ timestamp: 1 });
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: "Error fetching messages" });
    }
});

app.get("/GetuserId", checkForAuth('token'), async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      res.json(user.PhoneNumber); 
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.get('/user/joined-groups', checkForAuth('token'), async (req, res) => {
    try {
      const phoneNumber = req.user.PhoneNumber; // Extract phone number from the token
      const user = await User.findOne({ PhoneNumber: phoneNumber })
        .populate('joinedGroups');  // Populate the 'joinedGroups' field with Group documents
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Return the populated groups
      res.status(200).json({ joinedGroups: user.joinedGroups });
    } catch (error) {
      console.error("Error fetching joined groups:", error);
      res.status(500).json({ message: 'Failed to fetch joined groups' });
    }
  });
  
  
server.listen(9000, () => {
    console.log(`Server is listening on port 9000`);
});

