import Stripe from "stripe";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/Cart.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // make sure `req.rawBody` is used
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const userId = session.metadata.userId;
      const cartId = session.metadata.cartId;
      const totalAmount = session.metadata.totalAmount;

      const cart = await Cart.findById(cartId).populate("products.productId");

      // Save as order
      const order = new Order({
        userId,
        products: cart.products, // or map cart.products if your Cart uses different format
        totalAmount,
        address: Order.address || "Not provided", // or fetch from user profile if needed
        email: session.customer_email,
        paymentIntentId: session.payment_intent,
        status: "paid",
      });

      await order.save();

      // Clear cart
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    } catch (err) {
      console.error("Error creating order from webhook:", err);
    }
  }

  res.status(200).send("Webhook received");
};
