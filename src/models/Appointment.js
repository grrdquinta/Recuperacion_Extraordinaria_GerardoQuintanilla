import { Schema, model } from 'mongoose';

const AppointmetSchema = new Schema({
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
  fechaCita: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['programada', 'completada', 'cancelada'],
    default: 'programada'
  },
  notas: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default model('Appointmet', AppointmetSchema);