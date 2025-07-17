import express from "express";
import multer from "multer";
import {
  postProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  me,
} from "../controllers/product.controller.js";
import { protect } from "../middlewares/isLoggedIn.middleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Place specific routes BEFORE parameterized routes
router.get("/me", protect, me);
router.get("/my-products", protect, getMyProducts);

// General product routes
router.post("/", protect, upload.array("images", 15), postProduct);
router.get("/", getAllProducts);

// Parameterized routes come LAST
router.get("/:id", getProductById);
router.put("/:id", protect, upload.array("images", 10), updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
