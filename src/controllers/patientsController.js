import Patient from "../models/Patient.js";
import { v2 as cloudinary } from 'cloudinary';
import { config } from "../config.js";
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs'; // ← Agregar esta importación

// Configurar Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudinary_name,        
    api_key: config.cloudinary.cloudinary_api_key,       
    api_secret: config.cloudinary.cloudinary_api_secret   
});

const patientsController = {};

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
    return `dentist/patients/${publicId}`;
};

// GET /api/patients
patientsController.getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().select('-contrasena').sort({ createdAt: -1 });
    
    res.status(200).json(patients);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/patients/:id
patientsController.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }
    
    const patient = await Patient.findById(id).select('-contrasena');
    
    if (!patient) {
      return res.status(404).json({ 
        message: "Paciente no encontrado" 
      });
    }
    
    res.status(200).json(patient);
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/patients
patientsController.createPatient = async (req, res) => {
  try {
    const {
      nombre,
      correo,
      contrasena,
      FechaNacimiento,
      telefono,
      direccion
    } = req.body;

    // Validar campos requeridos
    if (!nombre || nombre.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El nombre del paciente es requerido' 
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

    // Verificar si ya existe un paciente con el mismo correo
    const existingPatient = await Patient.findOne({ correo: correo.trim() });
    if (existingPatient) {
        return res.status(409).json({ 
            message: 'Ya existe un paciente con ese correo electrónico' 
        });
    }

    let imageUrl = null;

    // Procesar imagen si se proporciona
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'dentist/patients',
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

    // Preparar datos del paciente
    const patientData = {
      nombre: nombre.trim(),
      correo: correo.trim(),
      contrasena: hashedPassword, // ← Usar la contraseña hasheada
      FechaNacimiento: FechaNacimiento || undefined,
      telefono: telefono ? telefono.trim() : undefined,
      direccion: direccion ? direccion.trim() : undefined,
      imageUrl: imageUrl || 'https://res.cloudinary.com/djrbaveph/image/upload/v1747283422/default_mgkskg.jpg'
    };

    const newPatient = new Patient(patientData);
    const savedPatient = await newPatient.save();

    // No enviar la contraseña en la respuesta
    const patientResponse = savedPatient.toObject();
    delete patientResponse.contrasena;

    res.status(201).json({
      message: "Paciente creado exitosamente",
      patient: patientResponse
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    
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
            message: 'Ya existe un paciente con ese correo electrónico' 
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/patients/:id
patientsController.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      correo,
      contrasena,
      FechaNacimiento,
      telefono,
      direccion
    } = req.body;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar el paciente existente
    const existingPatient = await Patient.findById(id);

    if (!existingPatient) {
        return res.status(404).json({ 
            message: 'Paciente no encontrado' 
        });
    }

    // Preparar datos de actualización
    let updateData = {};

    // Validar y actualizar nombre si se proporciona
    if (nombre) {
        if (nombre.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El nombre del paciente no puede estar vacío' 
            });
        }
        updateData.nombre = nombre.trim();
    }

    // Validar y actualizar correo si se proporciona
    if (correo !== undefined) {
        if (correo.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El correo electrónico no puede estar vacío' 
            });
        }

        if (correo.trim() !== existingPatient.correo) {
            const duplicatePatient = await Patient.findOne({ 
                correo: correo.trim(),
                _id: { $ne: id }
            });

            if (duplicatePatient) {
                return res.status(409).json({ 
                    message: 'Ya existe un paciente con ese correo electrónico' 
                });
            }
        }
        updateData.correo = correo.trim();
    }

    // Actualizar contraseña si se proporciona
    if (contrasena && contrasena.trim().length > 0) {
        updateData.contrasena = await bcryptjs.hash(contrasena, 10);
    }

    // Actualizar otros campos si se proporcionan
    if (FechaNacimiento !== undefined) updateData.FechaNacimiento = FechaNacimiento;
    if (telefono !== undefined) updateData.telefono = telefono.trim();
    if (direccion !== undefined) updateData.direccion = direccion.trim();

    // Procesar nueva imagen si se proporciona
    if (req.file) {
        try {
            // Eliminar imagen anterior si no es la default
            if (existingPatient.imageUrl && 
                !existingPatient.imageUrl.includes('default_mgkskg.jpg')) {
                const publicId = extractPublicIdFromUrl(existingPatient.imageUrl);
                await cloudinary.uploader.destroy(publicId);
            }

            // Subir nueva imagen
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'dentist/patients',
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

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-contrasena');

    res.status(200).json({
      message: "Paciente actualizado exitosamente",
      patient: updatedPatient
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    
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
            message: 'Ya existe un paciente con ese correo electrónico' 
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/patients/:id
patientsController.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar el paciente
    const patient = await Patient.findById(id);

    if (!patient) {
        return res.status(404).json({ 
            message: 'Paciente no encontrado' 
        });
    }

    // Eliminar imagen de Cloudinary si existe y no es la default
    if (patient.imageUrl && !patient.imageUrl.includes('default_mgkskg.jpg')) {
        try {
            const publicId = extractPublicIdFromUrl(patient.imageUrl);
            await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
            console.error('Error al eliminar imagen de Cloudinary:', cloudinaryError);
            // Continuar con la eliminación aunque falle la imagen
        }
    }

    // Eliminar de la base de datos
    await Patient.findByIdAndDelete(id);

    res.status(200).json({ 
        message: 'Paciente eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default patientsController;