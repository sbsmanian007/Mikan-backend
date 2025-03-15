const Career = require('../models/Career');
const nodemailer = require('nodemailer');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'resumes'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Get all careers
const getCareers = async (req, res) => {
  try {
    console.log('Fetching all careers');
    const careers = await Career.find();
    res.json(careers);
  } catch (error) {
    console.error('Error fetching careers:', error);
    res.status(500).json({ message: 'Error fetching careers', error: error.message });
  }
};

// Create a new career
const createCareer = async (req, res) => {
  try {
    console.log('Creating new career with data:', req.body);
    
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const career = await Career.create({
      title,
      description
    });

    console.log('Career created successfully:', career);
    res.status(201).json(career);
  } catch (error) {
    console.error('Error creating career:', error);
    res.status(500).json({ message: 'Error creating career', error: error.message });
  }
};

// Update a career
const updateCareer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating career with ID:', id);
    console.log('Update data:', req.body);

    if (!id) {
      return res.status(400).json({ message: 'Career ID is required' });
    }

    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const career = await Career.findById(id);
    if (!career) {
      console.log('Career not found with ID:', id);
      return res.status(404).json({ message: 'Career not found' });
    }

    career.title = title;
    career.description = description;
    await career.save();

    console.log('Career updated successfully:', career);
    res.json(career);
  } catch (error) {
    console.error('Error updating career:', error);
    res.status(500).json({ message: 'Error updating career', error: error.message });
  }
};

// Delete a career
const deleteCareer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting career with ID:', id);

    if (!id) {
      return res.status(400).json({ message: 'Career ID is required' });
    }

    const career = await Career.findById(id);
    if (!career) {
      console.log('Career not found with ID:', id);
      return res.status(404).json({ message: 'Career not found' });
    }

    await career.deleteOne();
    console.log('Career deleted successfully');
    res.json({ message: 'Career deleted successfully' });
  } catch (error) {
    console.error('Error deleting career:', error);
    res.status(500).json({ message: 'Error deleting career', error: error.message });
  }
};

// Apply for a career
const applyForCareer = async (req, res) => {
  try {
    console.log('Starting career application process');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'Please upload a resume' });
    }

    const { jobTitle, name, email } = req.body;
    console.log('Application details:', { jobTitle, name, email });

    if (!name || !email) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Name and email are required' });
    }

    console.log('Uploading to Cloudinary...');
    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);
    console.log('Cloudinary upload successful:', result.secure_url);

    console.log('Preparing email...');
    // Send email with resume link
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to admin email
      subject: `New Job Application for ${jobTitle}`,
      html: `
        <h2>New Job Application</h2>
        <p><strong>Position:</strong> ${jobTitle}</p>
        <p><strong>Applicant Name:</strong> ${name}</p>
        <p><strong>Applicant Email:</strong> ${email}</p>
        <p><strong>Resume Link:</strong> <a href="${result.secure_url}">${result.secure_url}</a></p>
      `
    };

    console.log('Sending email...');
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.status(200).json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Detailed error in career application:', error);
    res.status(500).json({ 
      message: 'Failed to submit application',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Export all functions
module.exports = {
  getCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  applyForCareer
}; 