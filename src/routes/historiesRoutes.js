import historiesController from '../controllers/historiesController.js';
import { authMiddleware } from "../middleware/authMiddleware.js";
import express from 'express';
import multer from 'multer';

// Configuración de multer para múltiples archivos
const upload = multer({ 
  dest: 'uploads/histories/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite por archivo
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes'), false);
    }
  }
});

const historiesRoutes = express.Router();

// Todas las rutas requieren autenticación

// Rutas para obtener historias por paciente o doctor
historiesRoutes.get("/paciente/:patientId", authMiddleware, historiesController.getHistoriesByPatient);
historiesRoutes.get("/doctor/:doctorId", authMiddleware, historiesController.getHistoriesByDoctor);

// Rutas principales
historiesRoutes.get("/", authMiddleware, historiesController.getHistories);
historiesRoutes.get("/:id", authMiddleware, historiesController.getHistoryById);
historiesRoutes.post("/", authMiddleware,  upload.array('archivos', 5), historiesController.createHistory);
historiesRoutes.put("/:id", authMiddleware,  upload.array('archivos', 5), historiesController.updateHistory);
historiesRoutes.delete("/:id", authMiddleware, historiesController.deleteHistory);

// Ruta para eliminar archivo adjunto específico
historiesRoutes.delete("/:id/archivo/:index", authMiddleware, historiesController.deleteArchivoAdjunto);

export default historiesRoutes;