const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
mongoose.connect("mongodb://127.0.0.1:27017/blogapp",{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Connection error", err));

const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.get("/v1/blogapp", (req, res)=>{
    res.render("index");
});

app.post("/v1/blogapp/login", (req, res)=>{
    const{username, email, password} = req.body;
    console.log("Login:", username, email, password);
    res.send("Login form submitted");
});

app.get("/v1/blogapp/signup", (req, res)=>{
    res.render("signup");
});

app.post("/v1/blogapp/signup", async (req, res)=>{
    const{username, email, password, confirmPassword} = req.body;
    // console.log("Login:", username, email, password, confirmPassword);
    if(password != confirmPassword){
        return res.send("Password do not match");
    }

    try{
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.send('Email already registered');
        }

        const newUser = new User({username, email, password});
        await newUser.save();
        res.send("Account created");
        res.redirect("/");
    } catch (err){
        console.error("Signup error:", err);
        res.send("Something went wrong. Try again.");
    }
});

// create post
app.post('/v1/blogapp/posts', async (req, res) => {
  try {
    const { title, content, userId } = req.body;
    const post = new Post({ title, content, author: userId });
    await post.save();
    res.send('Post created!');
  } catch (err) {
    res.status(500).send('Error creating post');
  }
});

// read all posts
app.get('/v1/blogapp/posts', async (req, res) => {
    try{
        const posts = await Post.find()
            .populate('author', 'username')
            .sort({createdAt : -1});
        res.render("posts", {posts});

    } catch (err){
        console.error("Error fetching posts:", err);
        res.status(500).send('Error fetching blogs at this moment');
    }
});

// read single post by id
app.get('/v1/blogapp/posts/:id', async (req, res) => {
    try{
        const postID = req.params.id;
        const Post = await Post.findById(postID);
        if(!Post){
            return res.status(404).send("Post not found");
        }
        res.render("singlePost", {Post});
    } catch(err){
        console.error("Error fetching post:", err);
        res.status(500).send("Server error");
    }
});

// update post
app.put('v1/blogapp/posts/:id', async (req, res) => {
    const postID = req.params;
    const {title, content} = req.body;
    try{
        const updatedPost = await Post.findByIdAndUpdate(postID, {title, content}, {new : true}).populate('author', 'username');
        if(!updatedPost){
            return res.status(404).send('Post not found');
        }
        res.render('updatedPost', { post: updatedPost });
    } catch (err){
        console.error("Error updating post:", err);
        res.status(500).send("Server error while updating post");
    }
});

// delete post
app.delete('/v1/blogapp/posts/:id', async (req, res) => {
    const postID = req.params.id;
    try{
        const deletedPost = await Post.findByIdAndDelete(postID);
        if (!deletedPost) {
            return res.status(404).send('Post not found');
        }
        res.redirect('/v1/blogapp/posts');
    } catch (err){
        console.error('Error deleting post:', err);
        res.status(500).send('Failed to delete post');
    }
});

// create comment
app.post('/v1/blogapp/comments', async (req, res) => {
  try {
    const { content, postId, userId } = req.body;
    const comment = new Comment({ content, post: postId, author: userId });
    await comment.save();
    res.send('Comment added!');
  } catch (err) {
    res.status(500).send('Error creating comment');
  }
});

// read all comments of a single post
app.get('/v1/blogapp/posts/:id/comments', async (req, res) => {
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
app.get('/v1/blogapp/posts/:id1/comments/:id2', async (req, res) => {
    try{
        const postID = req.params.id1;
        const commentID = req.params.id2;
        const singleComment = await Comment.findOne({post : postID, _id : commentID}).populate('author', 'username');
        res.render('comment', {comment : singleComment});
    } catch (err){
        console.error(err);
        res.status(500).send('Error fetching comments');
    }
});

// update a comment
app.put('/v1/blogapp/posts/:id1/comments/:id2', async (req, res) => {
    try{
        const postID = req.params.id1;
        const commentID = req.params.id2;
        const { content } = req.body;
        const updatedComment = await Comment.findOneAndUpdate({post : postID, _id : commentID}, {content}, {new : true}).populate('author', 'username');
        if(!updatedComment){
            return res.status(404).send("Comment not found or does not belong to the given post");
        }
        res.render('updatedComment', {comment : updatedComment});
    } catch (err){
        console.error("Error updating comment:", err);
        res.status(500).send("Server error while updating comment");
    }
});

// delete a comment
app.delete('/v1/blogapp/posts/:id1/comments/:id2', async (req, res) => {
    const postID = req.params.id1;
    const commentID = req.params.id2;
    try{
        const deletedComment = await Comment.findOneAndDelete({post : postID, _id : commentID});
        if (!deletedComment) {
            return res.status(404).send('Comment not found');
        }
        res.redirect(`/v1/blogapp/posts/${postID}/comments`);
    } catch (err){
        console.error('Error deleting comment:', err);
        res.status(500).send('Failed to delete comment');
    }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});