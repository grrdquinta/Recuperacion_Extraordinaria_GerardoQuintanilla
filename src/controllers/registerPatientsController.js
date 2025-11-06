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

// Verificar el código
/*registerPatientsController.verifyCodeEmail = async (req, res) => {
  const { verificationCode } = req.body;
  const token = req.cookies.VerificationToken;

  try {
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "Token de verificación no encontrado" 
      });
    }

    // Verificar y decodificar el token
    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    const { email, verificationCode: storedCode } = decoded;

    // Comparar códigos
    if (verificationCode !== storedCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Código inválido" 
      });
    }

    // Cambiar el estado de isVerified a true
    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: "Cliente no encontrado" 
      });
    }

    client.isVerified = true;
    await client.save();

    res.clearCookie("VerificationToken");
    
    res.status(200).json({ 
      success: true, 
      message: "Email verificado exitosamente" 
    });
  } catch (error) {
    console.error("Error verificando código:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error verificando código" 
    });
  }
};*/

export default registerPatientsController;