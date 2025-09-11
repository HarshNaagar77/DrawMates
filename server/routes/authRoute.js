
import express from "express";
import { getLoggedInUserDetails, login, signup } from "../controllers/authController.js";
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/userdetails", verifyJWT, getLoggedInUserDetails);

export default router;