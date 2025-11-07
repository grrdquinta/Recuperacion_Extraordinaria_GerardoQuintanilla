import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import express from 'express';
import appointmentsController from "../controllers/appointmentsController.js";

const appointmentsRoutes = express.Router();

// Todas las rutas requieren autenticación

// Rutas públicas para usuarios autenticados
appointmentsRoutes.get("/paciente/:patientId", authMiddleware, appointmentsController.getAppointmentsByPatient);
appointmentsRoutes.get("/doctor/:doctorId", authMiddleware, appointmentsController.getAppointmentsByDoctor);

// Rutas principales
appointmentsRoutes.get("/", authMiddleware, appointmentsController.getAppointments);
appointmentsRoutes.get("/:id", authMiddleware, appointmentsController.getAppointmentById);
appointmentsRoutes.post("/", authMiddleware, appointmentsController.createAppointment);
appointmentsRoutes.put("/:id", authMiddleware, appointmentsController.updateAppointment);
appointmentsRoutes.delete("/:id", authMiddleware, appointmentsController.deleteAppointment);

export default appointmentsRoutes;