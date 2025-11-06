const logoutController = {};

logoutController.logout = async (req, res) => {
  res.clearCookie("authToken");
  return res.status(200).json({ 
    success: true, 
    message: "Sesión cerrada exitosamente" 
  });
};

export default logoutController;