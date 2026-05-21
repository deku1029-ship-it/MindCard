const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const { authenticateToken, optionalAuthenticateToken, isAdmin, isAdminOrStaff } = require('../middlewares/authMiddleware');

// API Public
router.get('/', productController.getProducts);
router.get('/recommendations', optionalAuthenticateToken, productController.getRecommendations);
router.get('/best-sellers', productController.getBestSellers);
router.get('/:id', productController.getProductById);
router.get('/:id/related', productController.getRelatedProducts);
router.post('/:id/track', authenticateToken, productController.trackProductView);

// API Reviews
router.get('/:id/reviews', reviewController.getReviews);
router.post('/:id/reviews', authenticateToken, reviewController.addReview);

// API Admin
router.post('/', authenticateToken, isAdminOrStaff, productController.createProduct);
router.put('/:id', authenticateToken, isAdminOrStaff, productController.updateProduct);
router.delete('/:id', authenticateToken, isAdminOrStaff, productController.deleteProduct);

module.exports = router;
