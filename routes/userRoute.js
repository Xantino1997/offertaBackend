// routes/userRoute.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const userController = require('../authController/userController');

router.get('/profile',          auth,                          userController.getProfile);
router.put('/update',           auth,                          userController.updateProfile);
router.put('/change-password',  auth,                          userController.changePassword);
router.post('/avatar',          auth, upload.single('avatar'), userController.updateAvatar);

module.exports = router;