import departmentsController from '../controllers/departmentsController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import express from 'express';

const departmentsRoutes = express.Router();

// Rutas públicas (solo lectura)
departmentsRoutes.get("/", departmentsController.getDepartments);
departmentsRoutes.get("/:id", departmentsController.getDepartmentById);

// Rutas protegidas para admin
departmentsRoutes.post("/", authMiddleware, departmentsController.createDepartment);
departmentsRoutes.put("/:id", authMiddleware,  departmentsController.updateDepartment);
departmentsRoutes.delete("/:id", authMiddleware, departmentsController.deleteDepartment);

export default departmentsRoutes;