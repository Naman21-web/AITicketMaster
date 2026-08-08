import express from "express";
import { signup, login, logout, updateUser, getUsers } from "../controllers/user.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);
router.put("/update-user",authenticateToken,updateUser);
router.get("/users",authenticateToken,getUsers);

export default router;