import config from "../config.js";
import jsonwebtoken from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";

const loginController = {};

const maxAttempts = 3;
const lockTime = 15 * 60 * 1000; // 15 minutos

loginController.login = async (req, res) => {
  const { correo, contrasena } = req.body;

  // Validar campos requeridos
  if (!correo || !contrasena) {
    return res.status(400).json({ 
      success: false, 
      message: "Correo y contraseña son requeridos" 
    });
  }

  try {
    let userFound;
    let userType;

    // Verificar si es Admin
    if (
      correo === config.emailAdmin.email &&
      contrasena === config.emailAdmin.password
    ) {
      userType = "Admin";
      userFound = { 
        _id: "admin", 
        nombre: "Administrador",
        correo: config.emailAdmin.email
      };
    } else {
      // Verificar si es Doctor
      userFound = await Doctor.findOne({ correo });
      if (userFound) {
        userType = "Doctor";
      } else {
        // Verificar si es Paciente
        userFound = await Patient.findOne({ correo });
        if (userFound) {
          userType = "Patient";
        }
      }
    }

    if (!userFound) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuario no encontrado" 
      });
    }

    // Verificar si el usuario está bloqueado (solo para pacientes y doctores)
    if (userType !== "Admin") {
      if (userFound.lockTime && userFound.lockTime > Date.now()) {
        const minutosRestantes = Math.ceil(
          (userFound.lockTime - Date.now()) / 60000
        );
        return res.status(403).json({
          success: false,
          message: `Cuenta bloqueada. Intenta de nuevo en ${minutosRestantes} minutos`,
        });
      }
    }

    // Validar contraseña (solo para pacientes y doctores)
    if (userType !== "Admin") {
      const isMatch = await bcryptjs.compare(contrasena, userFound.contrasena);
      if (!isMatch) {
        // Incrementar intentos fallidos
        userFound.loginAttempts = (userFound.loginAttempts || 0) + 1;
        
        if (userFound.loginAttempts >= maxAttempts) {
          userFound.lockTime = Date.now() + lockTime;
          await userFound.save();
          return res.status(403).json({ 
            success: false, 
            message: "Usuario bloqueado por múltiples intentos fallidos" 
          });
        }
        
        await userFound.save();
        return res.status(401).json({ 
          success: false, 
          message: "Contraseña incorrecta" 
        });
      }

      // Resetear intentos fallidos si la contraseña es correcta
      userFound.loginAttempts = 0;
      userFound.lockTime = null;
      await userFound.save();
    }

    // Preparar datos del usuario para el token
    let userData = {
      id: userFound._id,
      userType,
      correo: userFound.correo
    };

    // Agregar información adicional según el tipo de usuario
    if (userType === "Patient") {
      userData.nombre = userFound.nombre;
      userData.imageUrl = userFound.imageUrl;
    } else if (userType === "Doctor") {
      userData.nombre = userFound.nombre;
      userData.apellido = userFound.apellido;
      userData.especialidad = userFound.especialidad;
      userData.imageUrl = userFound.imageUrl;
    } else if (userType === "Admin") {
      userData.nombre = userFound.nombre;
    }

    // Generar token
    const token = jsonwebtoken.sign(
      userData,
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn }
    );

    // Configurar cookie
    res.cookie("authToken", token, {
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
    });

    // Preparar respuesta según el tipo de usuario
    let responseData = {
      success: true, 
      message: "Login exitoso",
      userType: userType,
      user: {
        id: userFound._id,
        correo: userFound.correo
      }
    };

    // Agregar información adicional a la respuesta
    if (userType === "Patient") {
      responseData.user.nombre = userFound.nombre;
      responseData.user.telefono = userFound.telefono;
      responseData.user.direccion = userFound.direccion;
      responseData.user.imageUrl = userFound.imageUrl;
    } else if (userType === "Doctor") {
      responseData.user.nombre = userFound.nombre;
      responseData.user.apellido = userFound.apellido;
      responseData.user.especialidad = userFound.especialidad;
      responseData.user.biografia = userFound.biografia;
      responseData.user.imageUrl = userFound.imageUrl;
    } else if (userType === "Admin") {
      responseData.user.nombre = userFound.nombre;
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno del servidor" 
    });
  }
};

export default loginController;