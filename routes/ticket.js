import express from "express";
import { getTickets, getTicket, createTicket } from "../controllers/ticket.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/",authenticateToken,getTickets);
router.get("/:id",authenticateToken,getTicket);
router.post("/",authenticateToken,createTicket);

export default router;