const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers, getUser, createUser, updateUser,
  deleteUser, resetUserPassword, getDepartments
} = require('../controllers/userController');

router.use(protect); // All user routes require authentication

router.get('/departments', getDepartments);
router.get('/', authorize('admin', 'manager'), getUsers);
router.post('/', authorize('admin'), createUser);
router.get('/:id', authorize('admin', 'manager'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/reset-password', authorize('admin'), resetUserPassword);

module.exports = router;
