import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from "../controllers/notifications.controller";
import { authenticateJWT, requireSalon } from "../middlewares/auth";

const router = Router();

router.use(authenticateJWT, requireSalon);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
