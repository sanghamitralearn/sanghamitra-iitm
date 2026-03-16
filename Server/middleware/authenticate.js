const jwt = require('jsonwebtoken');
const User = require('../model/userSchema');

const authenticate = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized: No session provided' });
        }

        const rootUser = await User.findById(req.session.userId);

        if (!rootUser) {
            throw new Error('User not found');
        }

        req.rootUser = rootUser;
        req.userID = rootUser._id;

        next();
    } catch (err) {
        res.status(401).send('Unauthorized: No session provided');
        console.log(err);
    }
};

module.exports = authenticate;
