import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to calculate cart total
const calculateCartTotal = async (cart) => {
  await cart.populate("products.productId");
  const total = cart.products.reduce((acc, item) => {
    return acc + item.productId.price * item.quantity;
  }, 0);
  return total;
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        products: [{ productId, quantity: quantity || 1 }],
        totalPrice: 0,
      });
    } else {
      const existingProductIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (existingProductIndex >= 0) {
        cart.products[existingProductIndex].quantity += quantity || 1;
      } else {
        cart.products.push({ productId, quantity: quantity || 1 });
      }
    }

    cart.totalPrice = await calculateCartTotal(cart);

    await cart.save();

    await cart.populate("products.productId");

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart,
      totalPrice: cart.totalPrice,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not in cart" });
    }

    cart.products.splice(productIndex, 1);

    cart.totalPrice =
      cart.products.length > 0 ? await calculateCartTotal(cart) : 0;

    await cart.save();

    await cart.populate("products.productId");

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart,
      totalPrice: cart.totalPrice,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// New function to get cart details
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).populate("products.productId");

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { products: [], totalPrice: 0 },
      });
    }

    res.status(200).json({
      success: true,
      cart,
      totalPrice: cart.totalPrice,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// New function to update quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be greater than 0" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not in cart" });
    }

    cart.products[productIndex].quantity = quantity;

    cart.totalPrice = await calculateCartTotal(cart);

    await cart.save();

    await cart.populate("products.productId");

    res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart,
      totalPrice: cart.totalPrice,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// New function to clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.products = [];
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Stripe Payment - Create Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate("products.productId");

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const line_items = cart.products.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productId.name,
          description: item.productId.description || "",
        },
        unit_amount: Math.round(item.productId.price * 100), // Stripe needs price in cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: "http://localhost:3000/success", // replace with your frontend success page
      cancel_url: "http://localhost:3000/cancel",   // replace with your frontend cancel page
    });

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};