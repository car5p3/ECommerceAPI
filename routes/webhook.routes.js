import express from "express";
import { handleStripeWebhook } from "../controllers/webhook.controller.js";

const webhookRouter = express.Router();

webhookRouter.post("/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

export default webhookRouter;
