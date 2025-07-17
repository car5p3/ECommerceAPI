import { Product } from "../models/product.model.js";

export const authorizeProductOwnerOrAdmin = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const isOwner = product.owner.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (isOwner || isAdmin) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Authorization error",
      error: err.message,
    });
  }
};
