import History from "../models/History.js";
import { v2 as cloudinary } from 'cloudinary';
import { config } from "../config.js";
import mongoose from 'mongoose';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudinary_name,        
    api_key: config.cloudinary.cloudinary_api_key,       
    api_secret: config.cloudinary.cloudinary_api_secret   
});

const historiesController = {};

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
    return `dentist/histories/${publicId}`;
};

// GET /api/historias
historiesController.getHistories = async (req, res) => {
  try {
    const histories = await History.find()
      .populate('idPacient', 'nombre correo telefono FechaNacimiento')
      .populate('idDoctor', 'nombre apellido especialidad')
      .sort({ fechaRegistro: -1 });
    
    res.status(200).json(histories);
  } catch (error) {
    console.error('Error al obtener historias clínicas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/historias/:id
historiesController.getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }
    
    const history = await History.findById(id)
      .populate('idPacient', 'nombre correo telefono direccion FechaNacimiento imageUrl')
      .populate('idDoctor', 'nombre apellido especialidad biografia imageUrl');
    
    if (!history) {
      return res.status(404).json({ 
        message: "Historia clínica no encontrada" 
      });
    }
    
    res.status(200).json(history);
  } catch (error) {
    console.error('Error al obtener historia clínica:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/historias
historiesController.createHistory = async (req, res) => {
  try {
    const {
      idPacient,
      idDoctor,
      diagnostico,
      tratamiento,
      fechaRegistro
    } = req.body;

    // Validar campos requeridos
    if (!idPacient || !validateObjectId(idPacient)) {
        return res.status(400).json({ 
            message: 'ID de paciente válido es requerido' 
        });
    }

    if (!idDoctor || !validateObjectId(idDoctor)) {
        return res.status(400).json({ 
            message: 'ID de doctor válido es requerido' 
        });
    }

    if (!diagnostico || diagnostico.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El diagnóstico es requerido' 
        });
    }

    let archivosAdjuntos = [];

    // Procesar archivos adjuntos si se proporcionan
    if (req.files && req.files.length > 0) {
        try {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'dentist/histories',
                    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf', 'doc', 'docx'],
                    resource_type: 'auto'
                });
                archivosAdjuntos.push(result.secure_url);
            }
        } catch (uploadError) {
            console.error('Error al subir archivos:', uploadError);
            return res.status(400).json({ 
                message: 'Error al procesar los archivos adjuntos' 
            });
        }
    }

    // Preparar datos de la historia clínica
    const historyData = {
      idPacient,
      idDoctor,
      diagnostico: diagnostico.trim(),
      tratamiento: tratamiento ? tratamiento.trim() : undefined,
      archivosAdjuntos,
      fechaRegistro: fechaRegistro || new Date()
    };

    const newHistory = new History(historyData);
    const savedHistory = await newHistory.save();

    // Obtener la historia clínica con datos poblados
    const populatedHistory = await History.findById(savedHistory._id)
      .populate('idPacient', 'nombre correo telefono FechaNacimiento')
      .populate('idDoctor', 'nombre apellido especialidad');

    res.status(201).json({
      message: "Historia clínica creada exitosamente",
      history: populatedHistory
    });
  } catch (error) {
    console.error('Error al crear historia clínica:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
            message: 'Errores de validación',
            errors: validationErrors
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/historias/:id
historiesController.updateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      idPacient,
      idDoctor,
      diagnostico,
      tratamiento,
      fechaRegistro
    } = req.body;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar la historia clínica existente
    const existingHistory = await History.findById(id);

    if (!existingHistory) {
        return res.status(404).json({ 
            message: 'Historia clínica no encontrada' 
        });
    }

    // Preparar datos de actualización
    let updateData = {};

    // Validar y actualizar paciente si se proporciona
    if (idPacient) {
        if (!validateObjectId(idPacient)) {
            return res.status(400).json({ 
                message: 'ID de paciente inválido' 
            });
        }
        updateData.idPacient = idPacient;
    }

    // Validar y actualizar doctor si se proporciona
    if (idDoctor) {
        if (!validateObjectId(idDoctor)) {
            return res.status(400).json({ 
                message: 'ID de doctor inválido' 
            });
        }
        updateData.idDoctor = idDoctor;
    }

    // Validar y actualizar diagnóstico si se proporciona
    if (diagnostico !== undefined) {
        if (diagnostico.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El diagnóstico no puede estar vacío' 
            });
        }
        updateData.diagnostico = diagnostico.trim();
    }

    // Actualizar tratamiento si se proporciona
    if (tratamiento !== undefined) {
        updateData.tratamiento = tratamiento.trim();
    }

    // Actualizar fecha de registro si se proporciona
    if (fechaRegistro) {
        updateData.fechaRegistro = fechaRegistro;
    }

    // Procesar nuevos archivos adjuntos si se proporcionan
    if (req.files && req.files.length > 0) {
        try {
            const nuevosArchivos = [];
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'dentist/histories',
                    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf', 'doc', 'docx'],
                    resource_type: 'auto'
                });
                nuevosArchivos.push(result.secure_url);
            }
            
            // Combinar archivos existentes con los nuevos
            updateData.archivosAdjuntos = [...existingHistory.archivosAdjuntos, ...nuevosArchivos];
        } catch (uploadError) {
            console.error('Error al subir archivos:', uploadError);
            return res.status(400).json({ 
                message: 'Error al procesar los archivos adjuntos' 
            });
        }
    }

    const updatedHistory = await History.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('idPacient', 'nombre correo telefono FechaNacimiento')
    .populate('idDoctor', 'nombre apellido especialidad');

    res.status(200).json({
      message: "Historia clínica actualizada exitosamente",
      history: updatedHistory
    });
  } catch (error) {
    console.error('Error al actualizar historia clínica:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
            message: 'Errores de validación',
            errors: validationErrors
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/historias/:id
historiesController.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar la historia clínica
    const history = await History.findById(id);

    if (!history) {
        return res.status(404).json({ 
            message: 'Historia clínica no encontrada' 
        });
    }

    // Eliminar archivos adjuntos de Cloudinary si existen
    if (history.archivosAdjuntos && history.archivosAdjuntos.length > 0) {
        try {
            for (const archivoUrl of history.archivosAdjuntos) {
                const publicId = extractPublicIdFromUrl(archivoUrl);
                await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
            }
        } catch (cloudinaryError) {
            console.error('Error al eliminar archivos de Cloudinary:', cloudinaryError);
            // Continuar con la eliminación aunque fallen los archivos
        }
    }

    // Eliminar de la base de datos
    await History.findByIdAndDelete(id);

    res.status(200).json({ 
        message: 'Historia clínica eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar historia clínica:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/historias/paciente/:patientId
historiesController.getHistoriesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!validateObjectId(patientId)) {
        return res.status(400).json({ 
            message: 'Formato de ID de paciente inválido' 
        });
    }

    const histories = await History.find({ idPacient: patientId })
      .populate('idDoctor', 'nombre apellido especialidad imageUrl')
      .sort({ fechaRegistro: -1 });
    
    res.status(200).json(histories);
  } catch (error) {
    console.error('Error al obtener historias del paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/historias/doctor/:doctorId
historiesController.getHistoriesByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!validateObjectId(doctorId)) {
        return res.status(400).json({ 
            message: 'Formato de ID de doctor inválido' 
        });
    }

    const histories = await History.find({ idDoctor: doctorId })
      .populate('idPacient', 'nombre correo telefono FechaNacimiento imageUrl')
      .sort({ fechaRegistro: -1 });
    
    res.status(200).json(histories);
  } catch (error) {
    console.error('Error al obtener historias del doctor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/historias/:id/archivo/:index
historiesController.deleteArchivoAdjunto = async (req, res) => {
  try {
    const { id, index } = req.params;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    const indexNum = parseInt(index);
    if (isNaN(indexNum) || indexNum < 0) {
        return res.status(400).json({ 
            message: 'Índice de archivo inválido' 
        });
    }

    // Buscar la historia clínica
    const history = await History.findById(id);

    if (!history) {
        return res.status(404).json({ 
            message: 'Historia clínica no encontrada' 
        });
    }

    if (indexNum >= history.archivosAdjuntos.length) {
        return res.status(400).json({ 
            message: 'Índice de archivo fuera de rango' 
        });
    }

    // Eliminar archivo de Cloudinary
    const archivoUrl = history.archivosAdjuntos[indexNum];
    try {
        const publicId = extractPublicIdFromUrl(archivoUrl);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (cloudinaryError) {
        console.error('Error al eliminar archivo de Cloudinary:', cloudinaryError);
        // Continuar aunque falle la eliminación en Cloudinary
    }

    // Eliminar archivo del array
    history.archivosAdjuntos.splice(indexNum, 1);
    await history.save();

    const updatedHistory = await History.findById(id)
      .populate('idPacient', 'nombre correo telefono FechaNacimiento')
      .populate('idDoctor', 'nombre apellido especialidad');

    res.status(200).json({
      message: "Archivo adjunto eliminado exitosamente",
      history: updatedHistory
    });
  } catch (error) {
    console.error('Error al eliminar archivo adjunto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default historiesController;