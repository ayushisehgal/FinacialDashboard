const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(401).send({ message: "User with same email already exists." });
    }

    const newUser = new User({
      name,
      email,
    });

    await newUser.save();
    res.status(201).send({ message: "User account has been created", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email }).select("+authentication.password");
    if (!userExists) {
      return res.status(400).send({ message: "User with this email does not exist" });
    }

    const token = jwt.sign(String(userExists._id), process.env.APP_SECRET);
    res.cookie("AUTH_COOKIE", token, { httpOnly: true });

    if(userExists.authentication) {
      userExists.authentication.access_token = token;
    }

    await userExists.save();
    return res.status(200).send({ message: "User logged in successfully", accesstoken: token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  res.cookie("AUTH_COOKIE", "");
  res.status(200).send({ message: "logout successful" });
};

exports.getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find();
    return res.status(200).send(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};