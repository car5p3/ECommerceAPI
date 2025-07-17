import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";

// Create product
export const postProduct = async (req, res) => {
  try {
    console.log("Request user:", req.user);
    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const { title, description, price, category, stock, color, isFeatured } =
      req.body;

    // Fix: Check if req.files exists and is an array before mapping
    const images =
      req.files && req.files.length > 0
        ? req.files.map((file) => ({
            data: file.buffer,
            contentType: file.mimetype,
          }))
        : [];

    const newProduct = new Product({
      owner: user._id,
      title,
      description,
      price,
      category,
      stock,
      color,
      isFeatured: isFeatured || false,
      images,
    });

    await newProduct.save();

    res
      .status(201)
      .json({ success: true, message: "Product created", product: newProduct });
  } catch (err) {
    console.error("Create error:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("owner", "fullname email");
    res.status(200).json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "owner",
      "fullname email"
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedFields = {
      ...req.body,
    };

    // Fix: Check if req.files exists before mapping
    if (req.files && req.files.length > 0) {
      updatedFields.images = req.files.map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
      }));
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    if (!updatedProduct)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.status(200).json({
      success: true,
      message: "Product updated",
      product: updatedProduct,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get user's own products
export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user._id }).populate(
      "owner",
      "fullname email"
    );
    res.status(200).json({
      success: true,
      message: "User's products fetched successfully",
      products,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get authenticated user info
export const me = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Authenticated user fetched successfully",
      user: req.user,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
