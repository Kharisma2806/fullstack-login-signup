const User = require("../models/user");
const { hashPassword, comparePassword } = require("../helpers/auth.js");
const jwt = require("jsonwebtoken");

const test = (req, res) => {
  res.json("test is working");
};

// Register endpoint
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Check if name was entered
    if (!name) {
      return res.json({
        error: "name is required",
      });
    }
    // Check if password is good
    if (!password || password.length < 6) {
      return res.json({
        error: "Password is required and should be at least 6 characters long",
      });
    }
    // Check email
    const exist = await User.findOne({ email });
    if (exist) {
      return res.json({ error: "Email is taken already" });
    }

    const hashedPassword = await hashPassword(password);
    console.log("Hashed Password:", hashedPassword);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.json(user);
  } catch (error) {
    console.log(error);
  }
};

// Login endpoint
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: "No user found",
      });
    }

    // Log for debugging
    console.log("Input password:", password);
    console.log("Stored password hash:", user.password);

    // Check if passwords match
    const match = await comparePassword(password, user.password);
    if (match) {
      const token = jwt.sign(
        { email: user.email, id: user._id, name: user.name },
        process.env.JWT_SECRET,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token, { httpOnly: true }).json({ user, token });
        }
      );
    } else {
      res.json({ error: "Passwords do not match" });
    }
  } catch (error) {
    console.log(error);
    res.json({ error: "An error occurred during login" });
  }
};

const getProfile = (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
      if (err) throw err;
      res.json(user);
    });
  } else {
    res.json(null);
  }
};

// Export all functions in a single module.exports block
module.exports = {
  test,
  registerUser,
  loginUser,
  getProfile,
};
