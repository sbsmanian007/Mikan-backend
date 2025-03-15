const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  images: [{
    type: String
  }]
}, {
  timestamps: true
});

// Add a pre-save middleware to log the document
projectSchema.pre('save', function(next) {
  console.log('Saving project:', this);
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 