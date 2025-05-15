const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/blogapp");

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('comment', commentSchema);