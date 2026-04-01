const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false,
  },
  questionId: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  scoreGained: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number,
  },
  output: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
