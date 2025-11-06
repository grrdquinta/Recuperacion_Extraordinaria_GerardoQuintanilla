import { Schema, model } from 'mongoose';

const historySchema = new Schema({
  idPacient: {
    type: Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },
  idDoctor: {
    type: Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  diagnostico: {
    type: String,
    required: true,
    trim: true
  },
  tratamiento: {
    type: String,
    trim: true
  },
  archivosAdjuntos: {
    type: [String],
    default: []
  },
  fechaRegistro: {
    type: Date,
    required: true,
    default: Date.now
  },
}, {
  timestamps: true
});

export default model('History', historySchema);