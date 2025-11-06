import { Schema, model } from 'mongoose';

const patientSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Formato de correo electrónico inválido'],
    unique: true
  },
  contrasena: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    validate: {
        validator: function(password) {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
        },
        message: 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
    }
  },  
  FechaNacimiento: {
    type: Date,
    trim: true
  },
  telefono: {
        type: String,
        trim: true
    },
  direccion:{
    type: String,
    trim: true
  },
  imageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/djrbaveph/image/upload/v1747283422/default_mgkskg.jpg',
        trim: true
    },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockTime: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default model('Patient', patientSchema);