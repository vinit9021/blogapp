const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const {body, validationResult, param} = require('express-validator');
// const session = require('express-session');
const bcrypt = require('bcrypt');
// const MongoStore = require('connect-mongo');
// const flash = require('connect-flash');
mongoose.connect('mongodb://localhost:27017/blogapp');

const { generateToken } = require('./utils/jwt');
const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


// app.use(session({
//   secret: 'yourSecretKey',
//   resave: false,
//   saveUninitialized: false,
//   store: MongoStore.create({
//     mongoUrl: 'mongodb://127.0.0.1:27017/blogapp',
//     collectionName: 'sessions'
//   }),
//   cookie: {
//     maxAge: 1000 * 60 * 60 * 24, // 1 day
//   }
// }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// app.use(flash());

// app.use((req, res, next) => {
//   res.locals.successMessage = req.flash('success');
//   res.locals.errorMessage = req.flash('error');
//   next();
// });
app.use((req, res, next) => {
  console.log('Session userId:', req.userID);
  next();
});

// function requireLogin(req, res, next) {
//   if (!req.userID) {
//     return res.redirect('/');
//   }
//   next();
// }

app.get("/", (req, res)=>{
    try{
        res.render("login", { errors: [], oldInput: {}, generalError: null });
    } catch (err){
        console.error("Error loadinf login page");
        res.send("Something went wrong. Try again.");
    }
});

app.post("/login", [
  body('username').notEmpty().withMessage("Username is required"),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
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

    // ✅ Create JWT token
    const token = generateToken(user);

    // OPTIONAL: You can still set the session userId
    req.userID = user._id.toString();

    // ✅ Store the token in a cookie or send as response (you choose)
    res.cookie('token', token, {
      httpOnly: true,       // prevent client-side JS from accessing it
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.redirect('/homepage');
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Server error during login");
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

const authenticateToken = require('./middleware/auth');
app.use(authenticateToken);
app.get('/homepage', authenticateToken, async (req, res) => {
  if (!req.userID) {
    return res.redirect('/');
  }

  try {
    const user = await User.findById(req.userID);
    if (!user) return res.redirect('/');

    const posts = await Post.find()
      .populate('author')
      .sort({ createdAt: -1 });
    // const message = req.session.successMessage;
    // delete req.session.successMessage;
    res.render('homepage', { user, posts});
  } catch (err) {
    console.error("Homepage error:", err);
    res.redirect('/');
  }
});


app.get("/signup", (req, res) => {
  try {
    res.render("signup", { errors: [], oldInput: {}, generalError: "" });
  } catch (err) {
    console.error("Error loading SignUp page:", err);
    res.send("Something went wrong. Try again.");
  }
});

app.post("/signup", [
  body("username").notEmpty().withMessage("Username is required"),
  body("email").isEmail().withMessage("Enter a valid Email"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  })
], async (req, res) => {
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

    const hashedPassword = await bcrypt.hash(password, 10); // hash with saltRounds = 10
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.redirect("/"); // Redirect to home/login page after signup
  } catch (err) {
    console.error("Signup error:", err);
    res.render("signup", {
      errors: [],
      oldInput: {},
      generalError: "Something went wrong. Please try again."
    });
  }
});

// to display the create post page
app.get('/createpost', (req, res) => {

  try {
    res.render('createpost', { errors: [], oldInput: {} });
  } catch (err) {
    console.error("Error rendering create post page:", err);
    res.status(500).send("Something went wrong");
  }
});

// Create post with validation
app.post('/createpost', [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('content')
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters long')
], async (req, res) => {
  const errors = validationResult(req);

  const { title, content } = req.body;

  const userID = req.userID;
  if (!userID) {
    return res.status(401).send('You must be logged in to create a post');
  }

  if (!errors.isEmpty()) {
    // Return with validation errors and old input
    return res.render('createpost', { errors: errors.array(), oldInput: req.body });
  }

  try {
    const user = await User.findById(userID);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const post = new Post({
      title,
      content,
      author: user._id // still storing author as userId
    });

    await post.save();
    res.redirect('/homepage');
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).send("Error creating post");
  }
});


// read all posts
// app.get('/posts', async (req, res) => {
//     try{
//         const posts = await Post.find()
//             .populate('author', 'username')
//             .sort({createdAt : -1});
//         res.render("posts", {posts});

//     } catch (err){
//         console.error("Error fetching posts:", err);
//         res.status(500).send('Error fetching blogs at this moment');
//     }
// });

// displaying update form
app.get('/posts/:id/edit', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author');

    if (!post) {
      return res.status(404).send('Post not found');
    }

    // Ensure the user is logged in and is the author
    if (!req.userID || post.author._id.toString() !== req.userID) {
      const user = await User.findById(req.userID); // Optional, in case the template uses it
      const posts = await Post.find().populate('author'); // Fetch posts to pass to homepage

      return res.render('homepage', {
        user,
        posts,
        errorMessage: null
      });
    }

    const user = await User.findById(req.userID); // Optional, if needed in update form

    res.render('updatepost', {
      post,
      errors: [],
      oldInput: {
        title: post.title,
        content: post.content
      },
      postId: post._id,
      user
    });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Server error");
  }
});



// read single post by id
app.get('/posts/:id', async (req, res) => {
    try{
        const postID = req.params.id;
        const post = await Post.findById(postID).populate('author', 'username');
        if(!post){
            return res.status(404).send("Post not found");
        }
        const user = req.userID ? await User.findById(req.userID) : null;
        const comments = await Comment.find({ post: postID }).populate('author', 'username');
        res.render("singlepost", {post, user, comments});
    } catch(err){
        console.error("Error fetching post:", err);
        res.status(500).send("Server error");
    }
});


// update post
app.put('/posts/:id', [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  const errors = validationResult(req);
  const postID = req.params.id;
  const { title, content } = req.body;

  if (!errors.isEmpty()) {
    // Re-render the updatePost page with validation errors and old input
    const post = await Post.findById(postID).populate('author');
    return res.render('updatepost', {
      errors: errors.array(),
      oldInput: { title, content },
      postId: postID,
      post
    });
  }

  try {
    const updatedPost = await Post.findByIdAndUpdate(
      postID,
      { title, content },
      { new: true }
    ).populate('author', 'username');

    if (!updatedPost) {
      return res.status(404).send('Post not found');
    }
    if (updatedPost.author._id.toString() !== req.userID) {
        return res.status(403).send("You are not authorized to update this post");
    }
    res.redirect(`/posts/${postID}`);

  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).send("Server error while updating post");
  }
});

// delete post
app.delete(
  '/posts/:id',
  [
    param('id').isMongoId().withMessage('Invalid post ID format') 
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send('Invalid Post ID');
    }

    const postID = req.params.id;

    try {
      const deletedPost = await Post.findByIdAndDelete(postID);
      if (!deletedPost) {
        return res.status(404).send('Post not found');
      }

      res.redirect('/homepage');
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).send('Failed to delete post');
    }
  }
);

// Show comment form for a specific post
app.get('/posts/:postId/comment', async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    res.render('createcomment', {
      post,
      errors: [],
      oldInput: {}
    });
  } catch (err) {
    console.error("Error loading comment form:", err);
    res.status(500).send("Error loading comment form");
  }
});

// add comment
app.post('/posts/:id/comment', async (req, res) => {
  try {
    const { content, postId } = req.body;
    const postID = req.params.id;
    const userID = req.userID;

    if (!userID) {
      return res.status(401).send('Unauthorized: Please log in.');
    }

    const comment = new Comment({
      content,
      post: postID,
      author: userID
    });

    await comment.save();
    res.redirect(`/posts/${postID}`);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).send('Error creating comment');
  }
});


// read all comments of a single post
app.get('/posts/:id/comments', async (req, res) => {
    try{
        const postID = req.params.id;
        const comments = await Comment.find({post : postID}).populate('author', 'username');
        res.render('comments', {comments});
    } catch (err){
        console.error(err);
        res.status(500).send('Error fetching comments');
    }
});

// read a single comment from a post
app.get('/posts/:id1/comments/:id2', async (req, res) => {
    try{
        const postID = req.params.id1;
        const commentID = req.params.id2;
        const post = await Post.findById(postID);
        const singleComment = await Comment.findOne({post : postID, _id : commentID}).populate('author', 'username');
        const user = req.userID ? await User.findById(req.userID) : null;
        res.render('singlecomment', {comment : singleComment, post : post, user});
    } catch (err){
        console.error(err);
        res.status(500).send('Error fetching comments');
    }
});

// update a comment
app.put('/posts/:id1/comments/:id2', async (req, res) => {
    try{
        const postID = req.params.id1;
        const commentID = req.params.id2;
        const { content } = req.body;
        const updatedComment = await Comment.findOneAndUpdate({post : postID, _id : commentID}, {content}, {new : true}).populate('author', 'username');
        if(!updatedComment){
            return res.status(404).send("Comment not found or does not belong to the given post");
        }
        res.redirect(`/posts/${postID}`);
    } catch (err){
        console.error("Error updating comment:", err);
        res.status(500).send("Server error while updating comment");
    }
});

// delete a comment
app.delete('/posts/:id1/comments/:id2', async (req, res) => {
    const postID = req.params.id1;
    const commentID = req.params.id2;
    try{
        const deletedComment = await Comment.findOneAndDelete({post : postID, _id : commentID});
        if (!deletedComment) {
            return res.status(404).send('Comment not found');
        }
        res.redirect(`/posts/${postID}`);
    } catch (err){
        console.error('Error deleting comment:', err);
        res.status(500).send('Failed to delete comment');
    }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});