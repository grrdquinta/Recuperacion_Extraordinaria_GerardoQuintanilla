import patientsController from '../controllers/patientsController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import express from 'express';
import multer from 'multer';
import path from 'path';

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/patients/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'patient-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
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

const patientsRoutes = express.Router();

// Rutas públicas (solo lectura)
patientsRoutes.get("/", patientsController.getPatients);
patientsRoutes.get("/:id", patientsController.getPatientById);

// Rutas protegidas para admin con upload
patientsRoutes.post('/', authMiddleware, adminMiddleware, upload.single('image'), patientsController.createPatient);
patientsRoutes.put('/:id', authMiddleware, upload.single('image'), patientsController.updatePatient);
patientsRoutes.delete('/:id', authMiddleware, adminMiddleware, patientsController.deletePatient);

export default patientsRoutes;