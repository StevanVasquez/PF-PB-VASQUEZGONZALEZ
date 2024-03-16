import { Router } from "express";
import paymentsControl from "../controllers/paymentsControl.js";

const router = Router();
router.post('/create-checkout-session', paymentsControl.createSession)
router.get('/cancel', paymentsControl.failedSession)
export default router;