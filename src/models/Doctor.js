import { Schema, model } from 'mongoose';

const doctorSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  especialidad: {
    type: String,
    required: true,
    trim: true
  },
  biografia: {
    type: String,
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
  imageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/djrbaveph/image/upload/v1747283422/default_mgkskg.jpg',
        trim: true
    },
}, {
  timestamps: true
});

export default model('Doctor', doctorSchema);