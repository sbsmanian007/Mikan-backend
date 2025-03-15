const Project = require('../models/Project');
const cloudinary = require('../utils/cloudinary');
const streamifier = require('streamifier');

// Function to upload to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'projects'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    } catch (error) {
      console.error('Error in uploadToCloudinary:', error);
      reject(error);
    }
  });
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    console.log('Fetching all projects');
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// Create a new project
const createProject = async (req, res) => {
  try {
    console.log('Creating new project with data:', req.body);
    console.log('Files received:', req.files);

    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const imageUrls = [];

    // Upload images to Cloudinary if files are present
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          console.log('Uploading file:', file.originalname);
          const imageUrl = await uploadToCloudinary(file);
          imageUrls.push(imageUrl);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Continue with other files if one fails
        }
      }
    }

    const project = await Project.create({
      name,
      description,
      images: imageUrls
    });

    console.log('Project created successfully:', project);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// Update a project
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating project with ID:', id);
    console.log('Update data:', req.body);

    const project = await Project.findById(id);
    if (!project) {
      console.log('Project not found with ID:', id);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update basic info
    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;

    // Handle new images if any
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        try {
          const imageUrl = await uploadToCloudinary(file);
          newImageUrls.push(imageUrl);
        } catch (uploadError) {
          console.error('Error uploading new image:', uploadError);
        }
      }
      project.images = [...project.images, ...newImageUrls];
    }

    await project.save();
    console.log('Project updated successfully:', project);
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting project with ID:', id);

    const project = await Project.findById(id);
    if (!project) {
      console.log('Project not found with ID:', id);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete images from Cloudinary if they exist
    if (project.images && project.images.length > 0) {
      for (const imageUrl of project.images) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`projects/${publicId}`);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
        }
      }
    }

    await project.deleteOne();
    console.log('Project deleted successfully');
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

// Export all functions
module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject
}; 