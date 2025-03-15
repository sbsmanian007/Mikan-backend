const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getCareers, createCareer, updateCareer, deleteCareer, applyForCareer } = require('../controllers/careerController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
});

// Career management routes
router.route('/')
  .get(getCareers)
  .post(protect, createCareer);

router.route('/:id')
  .put(protect, updateCareer)
  .delete(protect, deleteCareer);

// Career application route
router.post('/apply', upload.single('resume'), applyForCareer);

module.exports = router; 