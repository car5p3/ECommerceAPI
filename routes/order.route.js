import { Router } from "express";
import { protect } from "../middlewares/isLoggedIn.middleware.js";
import { createPayment, getMyOrders } from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.post("/create", protect, createPayment);
orderRouter.get("/my-orders", protect, getMyOrders);

export default orderRouter;