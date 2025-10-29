import mongoose, { Schema, models } from 'mongoose';

export interface IProject extends Document {
  name: string;
  url: string;
  viewsCount: number;
  flowsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del proyecto es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    url: {
      type: String,
      required: [true, 'La URL del proyecto es requerida'],
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Debe ser una URL válida',
      },
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: [0, 'El conteo de vistas no puede ser negativo'],
    },
    flowsCount: {
      type: Number,
      default: 0,
      min: [0, 'El conteo de flujos no puede ser negativo'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para obtener las rutas del proyecto
ProjectSchema.virtual('routes', {
  ref: 'Route',
  localField: '_id',
  foreignField: 'projectId',
});

const Project = models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
