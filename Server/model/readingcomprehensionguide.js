const mongoose = require('mongoose');

// Define the schema
const RC_GuideSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures one guide per email
    match: /.+@.+\..+/ // Validates email format
  },
  categories: {
    mainIdea: {
      type: Number,
      default: 0,
    },
    authorsPurpose: {
      type: Number,
      default: 0,
    },
    specificDetails: {
      type: Number,
      default: 0,
    },
    inferences: {
      type: Number,
      default: 0,
    },
    vocabulary: {
      type: Number,
      default: 0,
    },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the model
const RC_Guide = mongoose.model('RC_Guide', RC_GuideSchema);

module.exports = RC_Guide;
