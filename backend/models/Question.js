const mongoose = require('mongoose');

const TestCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  }
});

const QuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  timeLimit: {
    type: Number,
  },
  testCases: [TestCaseSchema]
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
