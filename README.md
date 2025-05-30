# 🚀 RawRipple Blog App

**RawRipple** is a modern blog application built with Node.js, Express.js, and MongoDB. It allows users to sign up, log in, create posts, view posts, and manage their profiles.

---

## ✨ Features

- **🔒 User Authentication**
  - Sign up with username, email, and password
  - Login with username, email and password
  - Secure password hashing and JWT token generation
  - Protected routes using authentication middleware

- **📝 Blog Post Management**
  - Create, read, update, delete and view blog posts
  - Posts are associated with authors
  - Pagination for browsing posts

- **🖥️ User Experience**
  - Responsive design for desktop and mobile
  - Error handling and user feedback
  - Clean and intuitive interface

---

## 🛠️ Technologies Used

- **⚙️ Backend**
  - Node.js
  - Express.js
  - MongoDB (with Mongoose for ODM)
  - bcrypt for password hashing
  - JSON Web Tokens (JWT) for authentication

- **🖌️ Frontend**
  - Templating engine (e.g., EJS, Pug, or similar)
  - HTML5, CSS3, JavaScript

- **🧪 Testing**
  - Jest for unit and integration testing
  - Supertest for HTTP assertions
  - node-mocks-http for request/response mocking

---

## 🛠️ Installation

1. **🔽 Clone the repository**
git clone https://github.com/vinit9021/rawripple
cd RawRipple

2. **📦 Install dependencies**
npm install

3. **🔧 Set up environment variables**

- Create a `.env` file in the root directory
- Add the following variables:

  ```
  MONGODB_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret_key
  ```

4. **🚀 Start the server**
nodemon index.js

The app will be available at `http://localhost:3000`

---

## 🧪 Running Tests

To run unit and integration tests:
npm test

---

## 📂 Project Structure
RawRipple/
│
├── controllers/ # Route handlers
├── models/ # Database models (User, Post, Comment)
├── routes/ # Express routes
├── tests/ # Test files
├── utils/ # Utility functions (e.g., JWT)
├── views/ # Frontend templates
├── app.js # Main application entry
├── index.js # Main server entry (starts the Express app)
├── README.md # Project documentation
└── package.json # Project dependencies and scripts

---

## 🎯 Usage

1. **📝 Sign up** for a new account.
2. **🔑 Log in** with your credentials.
3. **✏️ Create** and **🔄 manage** your blog posts.
4. **🔍 Browse** posts from other users.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

**Happy blogging with RawRipple!** 🚀