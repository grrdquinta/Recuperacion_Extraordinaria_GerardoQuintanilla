import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { sendEmail, HTMLRecoveryEmail } from "../utils/mailPasswordRecovery.js";
import config from "../config.js";
import Patient from "../models/Patient.js";

const passwordRecoveryController = {};

passwordRecoveryController.requestCode = async (req, res) => {
  const { correo } = req.body;

  try {
    let userFound;
    let userType;

    // Buscar cliente
    userFound = await Patient.findOne({ correo });
    if (userFound) {
      userType = "patient";
    }

    if (!userFound) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    // Generar código de 5 dígitos
    const code = Math.floor(10000 + Math.random() * 60000).toString();

    // Generar token
    const token = jsonwebtoken.sign(
      { correo, code, userType, verified: false },
      config.JWT.secret,
      { expiresIn: "25m" }
    );

    res.cookie("tokenRecoveryCode", token, { maxAge: 25 * 60 * 1000 });

    // Enviar correo
    await sendEmail(
      correo,
      "Código de recuperación de contraseña - Doctores",
      `Tu código de verificación es: ${code}`,
      HTMLRecoveryEmail(code)
    );

    res.status(200).json({ 
      success: true, 
      message: "Código de verificación enviado" 
    });
  } catch (error) {
    console.error("Error solicitando código:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

passwordRecoveryController.verifyCode = async (req, res) => {
  const { code } = req.body;

  try {
    const token = req.cookies.tokenRecoveryCode;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "Token no encontrado" 
      });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    if (decoded.code !== code) {
      return res.status(400).json({ 
        success: false, 
        message: "Código inválido" 
      });
    }

    // Marcar como verificado
    const newToken = jsonwebtoken.sign(
      {
        correo: decoded.correo,
        code: decoded.code,
        userType: decoded.userType,
        verified: true,
      },
      config.JWT.secret,
      { expiresIn: "25m" }
    );

    res.cookie("tokenRecoveryCode", newToken, { maxAge: 25 * 60 * 1000 });

    res.status(200).json({ 
      success: true, 
      message: "Código verificado exitosamente" 
    });
  } catch (error) {
    console.error("Error verificando código:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error verificando código" 
    });
  }
};

passwordRecoveryController.newPassword = async (req, res) => {
  const { newPassword } = req.body;

  try {
    const token = req.cookies.tokenRecoveryCode;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: "Token no encontrado" 
      });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);

    if (!decoded.verified) {
      return res.status(400).json({ 
        success: false, 
        message: "Código no verificado" 
      });
    }

    const { correo } = decoded;

    // Encriptar nueva contraseña
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Actualizar contraseña en base de datos
    const user = await Patient.findOneAndUpdate(
      { correo },
      { contrasena: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    res.clearCookie("tokenRecoveryCode");

    res.status(200).json({ 
      success: true, 
      message: "Contraseña actualizada exitosamente" 
    });
  } catch (error) {
    console.error("Error actualizando contraseña:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error actualizando contraseña" 
    });
  }
};

export default passwordRecoveryController;