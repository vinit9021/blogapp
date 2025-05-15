const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res)=>{
    res.render("index");
})

app.post("/login", (req, res)=>{
    const{username, email, password} = req.body;
    console.log("Login:", username, email, password);
    res.send("Login form submitted");
})

app.get("/signup", (req, res)=>{
    res.render("signup");
})

app.post("/signup", (req, res)=>{
    const{username, email, password, confirmPassword} = req.body;
    console.log("Login:", username, email, password, confirmPassword);
    res.send("Account created");
    res.redirect("/");
})

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});