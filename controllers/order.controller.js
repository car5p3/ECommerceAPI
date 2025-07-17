import Stripe from "stripe";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
// import { Product } from '../models/Product.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Set in your .env

// POST /api/payments/create
export const createPayment = async (req, res) => {
  try {
    const userId = req.user._id; // Assume user is authenticated via middleware

    const cart = await Cart.findOne({ userId }).populate("products.productId");

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total amount from product price * quantity
    let totalAmount = 0;
    const lineItems = cart.items.map((item) => {
      const product = item.productId;
      const amount = product.price * item.quantity;
      totalAmount += amount;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
          },
          unit_amount: Math.round(product.price * 100), // Stripe expects amount in cents
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: req.user.email, // optionally prefill customer
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId: userId.toString(),
        cartId: cart._id.toString(),
        totalAmount: totalAmount.toFixed(2),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Payment creation error:", error);
    return res
      .status(500)
      .json({ error: "Something went wrong while creating payment" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).populate("products.productId");
    res.status(200).json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};