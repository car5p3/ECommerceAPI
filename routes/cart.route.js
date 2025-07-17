import { Router } from "express";
import { addToCart, clearCart, getCart, removeFromCart, updateCartQuantity } from "../controllers/cart.controller.js";
import { protect } from "../middlewares/isLoggedIn.middleware.js";

const cartRouter = Router();


cartRouter.get("/", protect, getCart);
cartRouter.post("/add", protect, addToCart);
cartRouter.delete("/remove", protect, removeFromCart);
cartRouter.put("/update", protect, updateCartQuantity);
cartRouter.delete("/clear", protect, clearCart);

export default cartRouter;