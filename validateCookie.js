const User = require('../models/userModel');

exports.validateCookie = async (req, res, next) => {
    const cookie = req.cookies;

    if(!cookie.AUTH_COOKIE) {
        return res.status(401).send({message:"User is not authorised. Login first"});
    }

    const userExistsWithAccessToken = await User.findOne({
        "authentication.access_token": cookie.AUTH_COOKIE
    });

    if(!userExistsWithAccessToken) {
        return res.status(401).send({message:"User is not authorised. Login first"});
    }
    next();
};
