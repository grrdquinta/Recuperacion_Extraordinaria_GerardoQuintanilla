import { Schema, model } from 'mongoose';

const reviewSchema = new Schema({
    idPacient: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'El ID del paciente es obligatorio']
    },
    idDoctor: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'El ID del doctor es obligatorio']
    },
    comentario: {
        type: String,
        required: [true, 'El mensaje de la reseña es obligatorio'],
        trim: true,
        maxlength: [500, 'El mensaje de la reseña no puede exceder los 500 caracteres']
    },
    calificacion: {
        type: Number,
        required: [true, 'La calificación es obligatoria'],
        min: [1, 'La calificación mínima es 1'],
        max: [5, 'La calificación máxima es 5']
    }
}, {
    timestamps: true,
    strict: false
});

export default model('Review', reviewSchema);