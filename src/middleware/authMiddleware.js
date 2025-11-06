import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";
import Client from "../models/Client.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token de acceso requerido" 
      });
    }

    const decoded = jsonwebtoken.verify(token, config.JWT.secret);
    
    // Si es admin
    if (decoded.userType === "Admin") {
      req.user = { id: "Admin", userType: "Admin" };
      return next();
    }

    // Si es cliente
    if (decoded.userType === "Client") {
      const client = await Client.findById(decoded.id);
      if (!client) {
        return res.status(401).json({ 
          success: false, 
          message: "Usuario no encontrado" 
        });
      }
      
      if (!client.isVerified) {
        return res.status(401).json({ 
          success: false, 
          message: "Email no verificado" 
        });
      }
      
      req.user = { id: client._id, userType: "Client" };
      return next();
    }

    return res.status(401).json({ 
      success: false, 
      message: "Token inválido" 
    });

  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Token inválido" 
    });
  }
};