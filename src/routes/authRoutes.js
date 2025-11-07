import express from "express";
import registerPatientsController from "../controllers/registerPatientsController.js";
import loginController from "../controllers/loginController.js";
import logoutController from "../controllers/logoutController.js";
import passwordRecoveryController from "../controllers/passwordRecoveryController.js";

const authRoutes = express.Router();

// Registro de clientes
authRoutes.post("/registrarPacientes", registerPatientsController.register);

// Login y logout
authRoutes.post("/iniciarSesion", loginController.login);
authRoutes.post("/cerrarSesion", logoutController.logout);

// Recuperación de contraseña
authRoutes.post("/recuperarContrasena/solicitarCodigo", passwordRecoveryController.requestCode);
authRoutes.post("/recuperarContrasena/verificarCodigo", passwordRecoveryController.verifyCode);
authRoutes.post("/recuperarContrasena/nuevaContrasena", passwordRecoveryController.newPassword);

export default authRoutes;