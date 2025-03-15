const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Project management routes
router.route('/')
  .get(getProjects)
  .post(protect, upload.array('images', 4), createProject);

router.route('/:id')
  .put(protect, upload.array('images', 4), updateProject)
  .delete(protect, deleteProject);

module.exports = router; 