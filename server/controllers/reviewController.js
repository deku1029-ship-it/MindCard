const { Review, User, Product } = require('../models');
const { sequelize } = require('../config/database');

const reviewController = {
    // Get all reviews for a product
    getReviews: async (req, res) => {
        try {
            const { id } = req.params; // product id

            const reviews = await Review.findAll({
                where: { product_id: id },
                include: [{
                    model: User,
                    attributes: ['id', 'username', 'email']
                }],
                order: [['createdAt', 'DESC']]
            });

            res.json(reviews);
        } catch (error) {
            console.error('[reviewController] Lỗi getReviews:', error);
            res.status(500).json({ message: 'Lỗi server khi lấy đánh giá', error: error.message });
        }
    },

    // Add a new review
    addReview: async (req, res) => {
        const transaction = await sequelize.transaction();
        try {
            const { id } = req.params; // product id
            const user_id = req.user.userId || req.user.id;
            const { rating, comment } = req.body;

            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
            }

            // Check if product exists
            const product = await Product.findByPk(id);
            if (!product) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }

            // Create review
            const review = await Review.create({
                product_id: id,
                user_id,
                rating,
                comment
            }, { transaction });

            // Calculate new average rating for the product
            // We use SQL aggregation to calculate average correctly
            const result = await Review.findAll({
                where: { product_id: id },
                attributes: [
                    [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
                ],
                transaction
            });

            let newAvgRating = parseFloat(result[0].dataValues.avgRating) || 0;
            // Round to 1 decimal place
            newAvgRating = Math.round(newAvgRating * 10) / 10;

            // Update product
            await product.update({ rating: newAvgRating }, { transaction });

            await transaction.commit();

            // Fetch the newly created review with User info to return to frontend
            const newReview = await Review.findByPk(review.id, {
                include: [{
                    model: User,
                    attributes: ['id', 'username', 'email']
                }]
            });

            res.status(201).json({
                message: 'Đã thêm đánh giá thành công',
                review: newReview,
                newAverageRating: newAvgRating
            });

        } catch (error) {
            await transaction.rollback();
            console.error('[reviewController] Lỗi addReview:', error);
            res.status(500).json({ message: 'Lỗi server khi lưu đánh giá', error: error.message });
        }
    }
};

module.exports = reviewController;
