const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true },
    subtopic: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["MCQ", "MSQ", "VALUE"],
      required: true,
    },
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctAnswers: [{ type: mongoose.Schema.Types.Mixed, required: true }],
    marks: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const IITM_Maths_2_Question = mongoose.model("iitm_maths_2_question", questionSchema);

module.exports = IITM_Maths_2_Question;



