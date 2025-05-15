const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/blogapp");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('post', postSchema);