import Appointment from "../models/Appointment.js";
import mongoose from 'mongoose';

const appointmentsController = {};

/**
 * Valida si un ID es un ObjectId válido de MongoDB
 */
const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// GET /api/appointments
appointmentsController.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('idPacient', 'nombre correo telefono')
      .populate('idDoctor', 'nombre apellido especialidad')
      .sort({ fechaCita: 1 });
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/appointments/:id
appointmentsController.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }
    
    const appointment = await Appointment.findById(id)
      .populate('idPacient', 'nombre correo telefono direccion FechaNacimiento')
      .populate('idDoctor', 'nombre apellido especialidad biografia imageUrl');
    
    if (!appointment) {
      return res.status(404).json({ 
        message: "Cita no encontrada" 
      });
    }
    
    res.status(200).json(appointment);
  } catch (error) {
    console.error('Error al obtener cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/appointments
appointmentsController.createAppointment = async (req, res) => {
  try {
    const {
      idPacient,
      idDoctor,
      fechaCita,
      notas
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

    if (!fechaCita) {
        return res.status(400).json({ 
            message: 'La fecha de la cita es requerida' 
        });
    }

    // Validar que la fecha sea futura
    const fechaCitaObj = new Date(fechaCita);
    if (fechaCitaObj <= new Date()) {
        return res.status(400).json({ 
            message: 'La fecha de la cita debe ser futura' 
        });
    }

    // Verificar conflictos de horario para el doctor
    const existingDoctorAppointment = await Appointment.findOne({
      idDoctor,
      fechaCita: {
        $gte: new Date(fechaCitaObj.getTime() - 30 * 60000), // 30 minutos antes
        $lte: new Date(fechaCitaObj.getTime() + 30 * 60000)  // 30 minutos después
      },
      status: { $ne: 'cancelada' }
    });

    if (existingDoctorAppointment) {
      return res.status(409).json({ 
        message: 'El doctor ya tiene una cita programada en ese horario' 
      });
    }

    // Verificar conflictos de horario para el paciente
    const existingPatientAppointment = await Appointment.findOne({
      idPacient,
      fechaCita: {
        $gte: new Date(fechaCitaObj.getTime() - 30 * 60000),
        $lte: new Date(fechaCitaObj.getTime() + 30 * 60000)
      },
      status: { $ne: 'cancelada' }
    });

    if (existingPatientAppointment) {
      return res.status(409).json({ 
        message: 'El paciente ya tiene una cita programada en ese horario' 
      });
    }

    // Preparar datos de la cita
    const appointmentData = {
      idPacient,
      idDoctor,
      fechaCita: fechaCitaObj,
      notas: notas ? notas.trim() : undefined
    };

    const newAppointment = new Appointment(appointmentData);
    const savedAppointment = await newAppointment.save();

    // Obtener la cita con datos poblados
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate('idPacient', 'nombre correo telefono')
      .populate('idDoctor', 'nombre apellido especialidad');

    res.status(201).json({
      message: "Cita creada exitosamente",
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('Error al crear cita:', error);
    
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

// PUT /api/appointments/:id
appointmentsController.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      idPacient,
      idDoctor,
      fechaCita,
      status,
      notas
    } = req.body;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar la cita existente
    const existingAppointment = await Appointment.findById(id);

    if (!existingAppointment) {
        return res.status(404).json({ 
            message: 'Cita no encontrada' 
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

    // Validar y actualizar fecha si se proporciona
    if (fechaCita) {
        const fechaCitaObj = new Date(fechaCita);
        if (fechaCitaObj <= new Date()) {
            return res.status(400).json({ 
                message: 'La fecha de la cita debe ser futura' 
            });
        }
        updateData.fechaCita = fechaCitaObj;

        // Verificar conflictos de horario solo si se cambia la fecha
        const doctorId = idDoctor || existingAppointment.idDoctor;
        const patientId = idPacient || existingAppointment.idPacient;

        // Verificar conflictos para el doctor
        const existingDoctorAppointment = await Appointment.findOne({
          idDoctor: doctorId,
          fechaCita: {
            $gte: new Date(fechaCitaObj.getTime() - 30 * 60000),
            $lte: new Date(fechaCitaObj.getTime() + 30 * 60000)
          },
          status: { $ne: 'cancelada' },
          _id: { $ne: id }
        });

        if (existingDoctorAppointment) {
          return res.status(409).json({ 
            message: 'El doctor ya tiene una cita programada en ese horario' 
          });
        }

        // Verificar conflictos para el paciente
        const existingPatientAppointment = await Appointment.findOne({
          idPacient: patientId,
          fechaCita: {
            $gte: new Date(fechaCitaObj.getTime() - 30 * 60000),
            $lte: new Date(fechaCitaObj.getTime() + 30 * 60000)
          },
          status: { $ne: 'cancelada' },
          _id: { $ne: id }
        });

        if (existingPatientAppointment) {
          return res.status(409).json({ 
            message: 'El paciente ya tiene una cita programada en ese horario' 
          });
        }
    }

    // Actualizar status si se proporciona
    if (status) {
        if (!['programada', 'completada', 'cancelada'].includes(status)) {
            return res.status(400).json({ 
                message: 'Estado inválido. Debe ser: programada, completada o cancelada' 
            });
        }
        updateData.status = status;
    }

    // Actualizar notas si se proporciona
    if (notas !== undefined) {
        updateData.notas = notas.trim();
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('idPacient', 'nombre correo telefono')
    .populate('idDoctor', 'nombre apellido especialidad');

    res.status(200).json({
      message: "Cita actualizada exitosamente",
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    
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

// DELETE /api/appointments/:id
appointmentsController.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar la cita
    const appointment = await Appointment.findById(id);

    if (!appointment) {
        return res.status(404).json({ 
            message: 'Cita no encontrada' 
        });
    }

    // Eliminar de la base de datos
    await Appointment.findByIdAndDelete(id);

    res.status(200).json({ 
        message: 'Cita eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/appointments/patient/:patientId
appointmentsController.getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!validateObjectId(patientId)) {
        return res.status(400).json({ 
            message: 'Formato de ID de paciente inválido' 
        });
    }

    const appointments = await Appointment.find({ idPacient: patientId })
      .populate('idDoctor', 'nombre apellido especialidad imageUrl')
      .sort({ fechaCita: 1 });
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error al obtener citas del paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/appointments/doctor/:doctorId
appointmentsController.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!validateObjectId(doctorId)) {
        return res.status(400).json({ 
            message: 'Formato de ID de doctor inválido' 
        });
    }

    const appointments = await Appointment.find({ idDoctor: doctorId })
      .populate('idPacient', 'nombre correo telefono FechaNacimiento')
      .sort({ fechaCita: 1 });
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error al obtener citas del doctor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default appointmentsController;