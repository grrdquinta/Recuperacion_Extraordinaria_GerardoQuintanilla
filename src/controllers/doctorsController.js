import Doctor from "../models/Doctor.js";
import { v2 as cloudinary } from 'cloudinary';
import { config } from "../config.js";
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudinary_name,        
    api_key: config.cloudinary.cloudinary_api_key,       
    api_secret: config.cloudinary.cloudinary_api_secret   
});

const doctorsController = {};

/**
 * Valida si un ID es un ObjectId válido de MongoDB
 */
const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Extrae el public_id de una URL de Cloudinary
 */
const extractPublicIdFromUrl = (url) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return `dentist/doctors/${publicId}`;
};

// GET /api/doctors
doctorsController.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-contrasena').sort({ createdAt: -1 });
    
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/doctors/:id
doctorsController.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }
    
    const doctor = await Doctor.findById(id).select('-contrasena');
    
    if (!doctor) {
      return res.status(404).json({ 
        message: "Doctor no encontrado" 
      });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    console.error('Error al obtener doctor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/doctors
doctorsController.createDoctor = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      especialidad,
      biografia,
      correo,
      contrasena
    } = req.body;

    // Validar campos requeridos
    if (!nombre || nombre.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El nombre del doctor es requerido' 
        });
    }

    if (!apellido || apellido.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El apellido del doctor es requerido' 
        });
    }

    if (!especialidad || especialidad.trim().length === 0) {
        return res.status(400).json({ 
            message: 'La especialidad del doctor es requerida' 
        });
    }

    if (!correo || correo.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El correo electrónico es requerido' 
        });
    }

    if (!contrasena || contrasena.trim().length === 0) {
        return res.status(400).json({ 
            message: 'La contraseña es requerida' 
        });
    }

    // Verificar si ya existe un doctor con el mismo correo
    const existingDoctor = await Doctor.findOne({ correo: correo.trim() });
    if (existingDoctor) {
        return res.status(409).json({ 
            message: 'Ya existe un doctor con ese correo electrónico' 
        });
    }

    let imageUrl = null;

    // Procesar imagen si se proporciona
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'dentist/doctors',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
                    { quality: 'auto' }
                ]
            });
            imageUrl = result.secure_url;
        } catch (uploadError) {
            console.error('Error al subir imagen:', uploadError);
            return res.status(400).json({ 
                message: 'Error al procesar la imagen' 
            });
        }
    }

    // Hash de la contraseña
    const hashedPassword = await bcryptjs.hash(contrasena, 10);

    // Preparar datos del doctor
    const doctorData = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      especialidad: especialidad.trim(),
      biografia: biografia ? biografia.trim() : undefined,
      correo: correo.trim(),
      contrasena: hashedPassword,
      imageUrl: imageUrl || 'https://res.cloudinary.com/djrbaveph/image/upload/v1747283422/default_mgkskg.jpg'
    };

    const newDoctor = new Doctor(doctorData);
    const savedDoctor = await newDoctor.save();

    // No enviar la contraseña en la respuesta
    const doctorResponse = savedDoctor.toObject();
    delete doctorResponse.contrasena;

    res.status(201).json({
      message: "Doctor creado exitosamente",
      doctor: doctorResponse
    });
  } catch (error) {
    console.error('Error al crear doctor:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
            message: 'Errores de validación',
            errors: validationErrors
        });
    }

    // Manejar error de correo duplicado
    if (error.code === 11000) {
        return res.status(409).json({ 
            message: 'Ya existe un doctor con ese correo electrónico' 
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/doctors/:id
doctorsController.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      especialidad,
      biografia,
      correo,
      contrasena
    } = req.body;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar el doctor existente
    const existingDoctor = await Doctor.findById(id);

    if (!existingDoctor) {
        return res.status(404).json({ 
            message: 'Doctor no encontrado' 
        });
    }

    // Preparar datos de actualización
    let updateData = {};

    // Validar y actualizar nombre si se proporciona
    if (nombre) {
        if (nombre.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El nombre del doctor no puede estar vacío' 
            });
        }
        updateData.nombre = nombre.trim();
    }

    // Validar y actualizar apellido si se proporciona
    if (apellido) {
        if (apellido.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El apellido del doctor no puede estar vacío' 
            });
        }
        updateData.apellido = apellido.trim();
    }

    // Validar y actualizar especialidad si se proporciona
    if (especialidad) {
        if (especialidad.trim().length === 0) {
            return res.status(400).json({ 
                message: 'La especialidad del doctor no puede estar vacía' 
            });
        }
        updateData.especialidad = especialidad.trim();
    }

    // Validar y actualizar correo si se proporciona
    if (correo !== undefined) {
        if (correo.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El correo electrónico no puede estar vacío' 
            });
        }

        if (correo.trim() !== existingDoctor.correo) {
            const duplicateDoctor = await Doctor.findOne({ 
                correo: correo.trim(),
                _id: { $ne: id }
            });

            if (duplicateDoctor) {
                return res.status(409).json({ 
                    message: 'Ya existe un doctor con ese correo electrónico' 
                });
            }
        }
        updateData.correo = correo.trim();
    }

    // Actualizar biografía si se proporciona
    if (biografia !== undefined) {
        updateData.biografia = biografia.trim();
    }

    // Actualizar contraseña si se proporciona
    if (contrasena && contrasena.trim().length > 0) {
        updateData.contrasena = await bcryptjs.hash(contrasena, 10);
    }

    // Procesar nueva imagen si se proporciona
    if (req.file) {
        try {
            // Eliminar imagen anterior si no es la default
            if (existingDoctor.imageUrl && 
                !existingDoctor.imageUrl.includes('default_mgkskg.jpg')) {
                const publicId = extractPublicIdFromUrl(existingDoctor.imageUrl);
                await cloudinary.uploader.destroy(publicId);
            }

            // Subir nueva imagen
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'dentist/doctors',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
                    { quality: 'auto' }
                ]
            });
            updateData.imageUrl = result.secure_url;
        } catch (uploadError) {
            console.error('Error al actualizar imagen:', uploadError);
            return res.status(400).json({ 
                message: 'Error al procesar la imagen' 
            });
        }
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-contrasena');

    res.status(200).json({
      message: "Doctor actualizado exitosamente",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error al actualizar doctor:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
            message: 'Errores de validación',
            errors: validationErrors
        });
    }

    // Manejar error de correo duplicado
    if (error.code === 11000) {
        return res.status(409).json({ 
            message: 'Ya existe un doctor con ese correo electrónico' 
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/doctors/:id
doctorsController.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar el doctor
    const doctor = await Doctor.findById(id);

    if (!doctor) {
        return res.status(404).json({ 
            message: 'Doctor no encontrado' 
        });
    }

    // Eliminar imagen de Cloudinary si existe y no es la default
    if (doctor.imageUrl && !doctor.imageUrl.includes('default_mgkskg.jpg')) {
        try {
            const publicId = extractPublicIdFromUrl(doctor.imageUrl);
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            console.error('Error al eliminar imagen de Cloudinary:', cloudinaryError);
            // Continuar con la eliminación aunque falle la imagen
        }
    }

    // Eliminar de la base de datos
    await Doctor.findByIdAndDelete(id);

    res.status(200).json({ 
        message: 'Doctor eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar doctor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default doctorsController;