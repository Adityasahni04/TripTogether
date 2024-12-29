require('dotenv').config(); 
const jwt = require('jsonwebtoken');

const authMiddleware = (token) => {
    try {
        // Synchronously verify the token using the SecretKey from environment variables
        const decoded = jwt.verify(token, process.env.SecretKey);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Function to generate JWT token
const generateToken = (userData) => {
    return jwt.sign(userData, process.env.SecretKey, { expiresIn: '2h' });
};

const checkForAuth = (cookieName) => {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName]; // Retrieve token from cookies
        if (!tokenCookieValue) {
            return next(); // No token found, proceed without user information
        }

        try {
            // Auth middleware is synchronous, no need to await
            const userPayload = authMiddleware(tokenCookieValue); // Verify the token
            req.user = { PhoneNumber: userPayload.PhoneNumber, Name: userPayload.Name };
            return next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error('Authentication error:', error);
            res.status(401).send('Unauthorized'); // Send unauthorized error if auth fails
        }
    };
};


module.exports = { authMiddleware, generateToken, checkForAuth };
