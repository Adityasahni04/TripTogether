require('dotenv').config(); 
const jwt = require('jsonwebtoken');

const authMiddleware = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.SecretKey);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

const generateToken = (userData) => {
    return jwt.sign(userData, process.env.SecretKey, { expiresIn: '2h' });
};

const checkForAuth = (cookieName) => {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        if (!tokenCookieValue) {
            return next(); 
        }
        try {
            const userPayload = authMiddleware(tokenCookieValue);
            req.user = userPayload;
            next();
        } catch (error) {
            res.status(401).send('Unauthorized'); 
        }
    };
};

module.exports = { authMiddleware, generateToken, checkForAuth };
