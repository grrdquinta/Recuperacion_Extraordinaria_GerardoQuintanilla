import express from "express";
import registerPatientsController from "../controllers/registerPatientsController.js";
import loginController from "../controllers/loginController.js";
import logoutController from "../controllers/logoutController.js";
//import passwordRecoveryController from "../controllers/passwordRecoveryController.js";

const authRoutes = express.Router();

// Registro de clientes
authRoutes.post("/registerPatients", registerPatientsController.register);
//authRoutes.post("/verifyEmail", registerClientsController.verifyCodeEmail);

// Login y logout
authRoutes.post("/login", loginController.login);
authRoutes.post("/logout", logoutController.logout);

// Recuperación de contraseña
/*authRoutes.post("/recoveryPassword/requestCode", passwordRecoveryController.requestCode);
authRoutes.post("/recoveryPassword/verifyCode", passwordRecoveryController.verifyCode);
authRoutes.post("/recoveryPassword/newPassword", passwordRecoveryController.newPassword);*/

export default authRoutes;