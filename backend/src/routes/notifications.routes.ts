import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from "../controllers/notifications.controller";
import { authenticateJWT, requireSalonAdmin } from "../middlewares/auth";

const router = Router();

router.use(authenticateJWT, requireSalonAdmin);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
