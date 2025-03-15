const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  }
}, {
  timestamps: true
});

// Add a pre-save middleware to log the document
careerSchema.pre('save', function(next) {
  console.log('Saving career:', this);
  next();
});

const Career = mongoose.model('Career', careerSchema);

module.exports = Career; 