export const adminMiddleware = (req, res, next) => {
  if (req.user.userType !== "Admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Acceso denegado. Solo administradores" 
    });
  }
  next();
};