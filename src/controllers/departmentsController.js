import Department from "../models/Department.js";
import mongoose from 'mongoose';

const departmentsController = {};

/**
 * Valida si un ID es un ObjectId válido de MongoDB
 */
const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// GET /api/departamentos
departmentsController.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ nombre: 1 });
    
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/departamentos/:id
departmentsController.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }
    
    const department = await Department.findById(id);
    
    if (!department) {
      return res.status(404).json({ 
        message: "Departamento no encontrado" 
      });
    }
    
    res.status(200).json(department);
  } catch (error) {
    console.error('Error al obtener departamento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/departamentos
departmentsController.createDepartment = async (req, res) => {
  try {
    const {
      nombre,
      descripcion
    } = req.body;

    // Validar campos requeridos
    if (!nombre || nombre.trim().length === 0) {
        return res.status(400).json({ 
            message: 'El nombre del departamento es requerido' 
        });
    }

    // Verificar si ya existe un departamento con el mismo nombre
    const existingDepartment = await Department.findOne({ 
      nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') } 
    });
    
    if (existingDepartment) {
        return res.status(409).json({ 
            message: 'Ya existe un departamento con ese nombre' 
        });
    }

    // Preparar datos del departamento
    const departmentData = {
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : undefined
    };

    const newDepartment = new Department(departmentData);
    const savedDepartment = await newDepartment.save();

    res.status(201).json({
      message: "Departamento creado exitosamente",
      department: savedDepartment
    });
  } catch (error) {
    console.error('Error al crear departamento:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
            message: 'Errores de validación',
            errors: validationErrors
        });
    }

    // Manejar error de nombre duplicado
    if (error.code === 11000) {
        return res.status(409).json({ 
            message: 'Ya existe un departamento con ese nombre' 
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/departamentos/:id
departmentsController.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion
    } = req.body;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar el departamento existente
    const existingDepartment = await Department.findById(id);

    if (!existingDepartment) {
        return res.status(404).json({ 
            message: 'Departamento no encontrado' 
        });
    }

    // Preparar datos de actualización
    let updateData = {};

    // Validar y actualizar nombre si se proporciona
    if (nombre !== undefined) {
        if (nombre.trim().length === 0) {
            return res.status(400).json({ 
                message: 'El nombre del departamento no puede estar vacío' 
            });
        }

        // Verificar si el nuevo nombre ya existe (excluyendo el actual)
        if (nombre.trim().toLowerCase() !== existingDepartment.nombre.toLowerCase()) {
            const duplicateDepartment = await Department.findOne({ 
                nombre: { $regex: new RegExp(`^${nombre.trim()}$`, 'i') },
                _id: { $ne: id }
            });

            if (duplicateDepartment) {
                return res.status(409).json({ 
                    message: 'Ya existe un departamento con ese nombre' 
                });
            }
        }
        updateData.nombre = nombre.trim();
    }

    // Actualizar descripción si se proporciona
    if (descripcion !== undefined) {
        updateData.descripcion = descripcion.trim();
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Departamento actualizado exitosamente",
      department: updatedDepartment
    });
  } catch (error) {
    console.error('Error al actualizar departamento:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
            message: 'Errores de validación',
            errors: validationErrors
        });
    }

    // Manejar error de nombre duplicado
    if (error.code === 11000) {
        return res.status(409).json({ 
            message: 'Ya existe un departamento con ese nombre' 
        });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/departamentos/:id
departmentsController.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar formato del ID
    if (!validateObjectId(id)) {
        return res.status(400).json({ 
            message: 'Formato de ID inválido' 
        });
    }

    // Buscar el departamento
    const department = await Department.findById(id);

    if (!department) {
        return res.status(404).json({ 
            message: 'Departamento no encontrado' 
        });
    }

    // Eliminar de la base de datos
    await Department.findByIdAndDelete(id);

    res.status(200).json({ 
        message: 'Departamento eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar departamento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default departmentsController;