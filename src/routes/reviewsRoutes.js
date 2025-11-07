import reviewsController from '../controllers/reviewsController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import express from 'express';

const reviewsRoutes = express.Router();

// Rutas públicas (solo lectura de reseñas por doctor)
reviewsRoutes.get("/doctor/:doctorId", reviewsController.getReviewsByDoctor);

// Todas las demás rutas requieren autenticación

// Rutas para pacientes
reviewsRoutes.get("/paciente/:patientId", authMiddleware, reviewsController.getReviewsByPatient);

// Rutas principales
reviewsRoutes.get("/", reviewsController.getReviews);
reviewsRoutes.get("/:id", reviewsController.getReviewById);
reviewsRoutes.post("/", authMiddleware, reviewsController.createReview);
reviewsRoutes.put("/:id", authMiddleware, reviewsController.updateReview);
reviewsRoutes.delete("/:id", authMiddleware, reviewsController.deleteReview);

export default reviewsRoutes;