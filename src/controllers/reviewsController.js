import Review from "../models/Review.js";
import mongoose from 'mongoose';

const reviewsController = {};

/**
 * Valida si un ID es un ObjectId válido de MongoDB
 */
const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// GET /api/resenas
reviewsController.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('idPacient', 'nombre correo imageUrl')
      .populate('idDoctor', 'nombre apellido especialidad imageUrl')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/resenas/:id
reviewsController.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }
    
    const review = await Review.findById(id)
      .populate('idPacient', 'nombre correo telefono imageUrl')
      .populate('idDoctor', 'nombre apellido especialidad biografia imageUrl');
    
    if (!review) {
      return res.status(404).json({ 
        message: "Reseña no encontrada" 
      });
    }
    
    res.status(200).json(review);
  } catch (error) {
    console.error('Error al obtener reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/resenas
reviewsController.createReview = async (req, res) => {
  try {
    const {
      idPacient,
      idDoctor,
      comentario,
      calificacion
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

    if (!comentario || comentario.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El comentario es requerido' 
        });
    }

    if (comentario.trim().length > 500) {
        return res.status(400).json({ 
            message: 'El comentario no puede exceder los 500 caracteres' 
        });
    }

    if (!calificacion || calificacion < 1 || calificacion > 5) {
        return res.status(400).json({ 
            message: 'La calificación debe ser un número entre 1 y 5' 
        });
    }

    // Verificar si el paciente ya ha reseñado a este doctor
    const existingReview = await Review.findOne({
      idPacient,
      idDoctor
    });

    if (existingReview) {
        return res.status(409).json({ 
            message: 'Ya has realizado una reseña para este doctor' 
        });
    }

    // Preparar datos de la reseña
    const reviewData = {
      idPacient,
      idDoctor,
      comentario: comentario.trim(),
      calificacion: parseInt(calificacion)
    };

    const newReview = new Review(reviewData);
    const savedReview = await newReview.save();

    // Obtener la reseña con datos poblados
    const populatedReview = await Review.findById(savedReview._id)
      .populate('idPacient', 'nombre correo imageUrl')
      .populate('idDoctor', 'nombre apellido especialidad imageUrl');

    res.status(201).json({
      message: "Reseña creada exitosamente",
      review: populatedReview
    });
  } catch (error) {
    console.error('Error al crear reseña:', error);
    
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

// PUT /api/resenas/:id
reviewsController.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      comentario,
      calificacion
    } = req.body;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar la reseña existente
    const existingReview = await Review.findById(id);

    if (!existingReview) {
        return res.status(404).json({ 
            message: 'Reseña no encontrada' 
        });
    }

    // Verificar que el usuario autenticado sea el dueño de la reseña
    if (req.user.userType === 'Patient' && existingReview.idPacient.toString() !== req.user.id) {
        return res.status(403).json({ 
            message: 'No tienes permiso para editar esta reseña' 
        });
    }

    // Preparar datos de actualización
    let updateData = {};

    // Validar y actualizar comentario si se proporciona
    if (comentario !== undefined) {
        if (comentario.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El comentario no puede estar vacío' 
            });
        }

        if (comentario.trim().length > 500) {
            return res.status(400).json({ 
                message: 'El comentario no puede exceder los 500 caracteres' 
            });
        }
        updateData.comentario = comentario.trim();
    }

    // Validar y actualizar calificación si se proporciona
    if (calificacion !== undefined) {
        const calificacionNum = parseInt(calificacion);
        if (calificacionNum < 1 || calificacionNum > 5) {
            return res.status(400).json({ 
                message: 'La calificación debe ser un número entre 1 y 5' 
            });
        }
        updateData.calificacion = calificacionNum;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('idPacient', 'nombre correo imageUrl')
    .populate('idDoctor', 'nombre apellido especialidad imageUrl');

    res.status(200).json({
      message: "Reseña actualizada exitosamente",
      review: updatedReview
    });
  } catch (error) {
    console.error('Error al actualizar reseña:', error);
    
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

// DELETE /api/resenas/:id
reviewsController.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar la reseña
    const review = await Review.findById(id);

    if (!review) {
        return res.status(404).json({ 
            message: 'Reseña no encontrada' 
        });
    }

    // Verificar permisos: solo el dueño de la reseña o un admin pueden eliminarla
    if (req.user.userType === 'Patient' && review.idPacient.toString() !== req.user.id) {
        return res.status(403).json({ 
            message: 'No tienes permiso para eliminar esta reseña' 
        });
    }

    // Eliminar de la base de datos
    await Review.findByIdAndDelete(id);

    res.status(200).json({ 
        message: 'Reseña eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar reseña:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/resenas/doctor/:doctorId
reviewsController.getReviewsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!validateObjectId(doctorId)) {
        return res.status(400).json({ 
            message: 'Formato de ID de doctor inválido' 
        });
    }

    const reviews = await Review.find({ idDoctor: doctorId })
      .populate('idPacient', 'nombre correo imageUrl')
      .sort({ createdAt: -1 });
    
    // Calcular promedio de calificaciones
    const stats = await Review.aggregate([
      { $match: { idDoctor: new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: '$idDoctor',
          promedioCalificacion: { $avg: '$calificacion' },
          totalResenas: { $sum: 1 },
          calificacion1: {
            $sum: { $cond: [{ $eq: ['$calificacion', 1] }, 1, 0] }
          },
          calificacion2: {
            $sum: { $cond: [{ $eq: ['$calificacion', 2] }, 1, 0] }
          },
          calificacion3: {
            $sum: { $cond: [{ $eq: ['$calificacion', 3] }, 1, 0] }
          },
          calificacion4: {
            $sum: { $cond: [{ $eq: ['$calificacion', 4] }, 1, 0] }
          },
          calificacion5: {
            $sum: { $cond: [{ $eq: ['$calificacion', 5] }, 1, 0] }
          }
        }
      }
    ]);

    const estadisticas = stats.length > 0 ? stats[0] : {
      promedioCalificacion: 0,
      totalResenas: 0,
      calificacion1: 0,
      calificacion2: 0,
      calificacion3: 0,
      calificacion4: 0,
      calificacion5: 0
    };

    res.status(200).json({
      reviews,
      estadisticas
    });
  } catch (error) {
    console.error('Error al obtener reseñas del doctor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/resenas/paciente/:patientId
reviewsController.getReviewsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!validateObjectId(patientId)) {
        return res.status(400).json({ 
            message: 'Formato de ID de paciente inválido' 
        });
    }

    // Verificar que el paciente solo pueda ver sus propias reseñas
    if (req.user.userType === 'Patient' && patientId !== req.user.id) {
        return res.status(403).json({ 
            message: 'No tienes permiso para ver estas reseñas' 
        });
    }

    const reviews = await Review.find({ idPacient: patientId })
      .populate('idDoctor', 'nombre apellido especialidad imageUrl')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error al obtener reseñas del paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default reviewsController;