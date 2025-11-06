import { Schema, model } from 'mongoose';

const departmentSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default model('Department', departmentSchema);