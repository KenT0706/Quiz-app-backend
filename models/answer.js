//models/answer.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const answerSchema = new Schema({
  quizPin: { type: Number, required: true }, 
  questionId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, required: false },
  userName: { type: String, default: 'Anonymous' }, // Add this line
  answerText: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const Answer = mongoose.model('Answer', answerSchema);
module.exports = Answer;