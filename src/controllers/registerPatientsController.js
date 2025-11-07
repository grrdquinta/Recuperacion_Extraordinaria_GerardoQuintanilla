import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { config } from "../config.js";
import Patient from "../models/Patient.js";

const registerPatientsController = {};

registerPatientsController.register = async (req, res) => {
  const { nombre, correo, contrasena, FechaNacimiento, telefono, direccion } = req.body;
  
  try {
    // Verificar si el cliente ya existe
    const existsClient = await Patient.findOne({ correo });
    if (existsClient) {
      return res.status(400).json({ 
        success: false, 
        message: "El cliente ya existe" 
      });
    }

    // Encriptar la contraseña
    const passwordHash = await bcryptjs.hash(contrasena, 10);

    // Guardar el cliente en la base de datos
    const newPatient = new Patient({
      nombre,
      correo,
      contrasena: passwordHash,
      FechaNacimiento, 
      telefono, 
      direccion, 
    });
    await newPatient.save();

    res.status(201).json({
      success: true,
      message: "Paciente registrado",
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

export default registerPatientsController;