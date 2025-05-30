const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { generateToken } = require('../utils/jwt');

// GET / handler
function loginGetHandler(req, res) {
  try {
    res.render("login", { errors: [], oldInput: {}, generalError: null });
  } catch (err) {
    console.error("Error loading login page");
    res.send("Something went wrong. Try again.");
  }
}

// POST /login handler
async function loginPostHandler(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', { errors: errors.array(), oldInput: req.body });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('login', {
        errors: [],
        oldInput: req.body,
        generalError: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.render('login', {
        errors: [],
        oldInput: req.body,
        generalError: "Invalid email or password"
      });
    }

    const token = generateToken(user);

    req.userID = user._id.toString();

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
    res.redirect('/homepage');
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Server error during login");
  }
}

function logoutHandler(req, res) {
  res.clearCookie('token');
  res.redirect('/login');
}

function signupGetHandler(req, res) {
  try {
    res.render("signup", { errors: [], oldInput: {}, generalError: "" });
  } catch (err) {
    console.error("Error loading SignUp page:", err);
    res.send("Something went wrong. Try again.");
  }
}

async function signupPostHandler(req, res) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Validation failed, show form with errors and input
    return res.render("signup", {
      errors: errors.array(),
      oldInput: req.body,
      generalError: ""
    });
  }

  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.redirect("/");
  } catch (err) {
    console.error("Signup error:", err);
    res.render("signup", {
      errors: [],
      oldInput: {},
      generalError: "Something went wrong. Please try again."
    });
  }
}




module.exports = { loginGetHandler, loginPostHandler, logoutHandler, signupGetHandler, signupPostHandler };
