import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token de acceso requerido" 
      });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    
    // Si es admin
    if (decoded.userType === "Admin") {
      req.user = { 
        id: "admin", 
        userType: "Admin",
        correo: decoded.correo,
        nombre: decoded.nombre
      };
      return next();
    }

    // Si es doctor
    if (decoded.userType === "Doctor") {
      const doctor = await Doctor.findById(decoded.id).select('-contrasena');
      if (!doctor) {
        return res.status(401).json({ 
          success: false, 
          message: "Doctor no encontrado" 
        });
      }
      
      req.user = { 
        id: doctor._id, 
        userType: "Doctor",
        correo: doctor.correo,
        nombre: doctor.nombre,
        apellido: doctor.apellido,
        especialidad: doctor.especialidad,
        biografia: doctor.biografia,
        imageUrl: doctor.imageUrl
      };
      return next();
    }

    // Si es paciente
    if (decoded.userType === "Patient") {
      const patient = await Patient.findById(decoded.id).select('-contrasena');
      if (!patient) {
        return res.status(401).json({ 
          success: false, 
          message: "Paciente no encontrado" 
        });
      }
      
      req.user = { 
        id: patient._id, 
        userType: "Patient",
        correo: patient.correo,
        nombre: patient.nombre,
        telefono: patient.telefono,
        direccion: patient.direccion,
        FechaNacimiento: patient.FechaNacimiento,
        imageUrl: patient.imageUrl
      };
      return next();
    }

    return res.status(401).json({ 
      success: false, 
      message: "Tipo de usuario no válido" 
    });

  } catch (error) {
    console.error("Error en auth middleware:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expirado" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token inválido" 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "Error en la autenticación" 
    });
  }
};