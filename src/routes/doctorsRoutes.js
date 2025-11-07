import doctorsController from '../controllers/doctorsController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import express from 'express';
import multer from 'multer';

// Configuración de multer
const upload = multer({ 
  dest: 'uploads/doctors/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

const doctorsRoutes = express.Router();

// Todas las rutas requieren autenticación y ser admin
doctorsRoutes.get("/", authMiddleware, adminMiddleware, doctorsController.getDoctors);
doctorsRoutes.get("/:id", authMiddleware, adminMiddleware, doctorsController.getDoctorById);
doctorsRoutes.post("/", authMiddleware, adminMiddleware, upload.single('image'), doctorsController.createDoctor);
doctorsRoutes.put("/:id", authMiddleware, adminMiddleware, upload.single('image'), doctorsController.updateDoctor);
doctorsRoutes.delete("/:id", authMiddleware, adminMiddleware, doctorsController.deleteDoctor);

export default doctorsRoutes;