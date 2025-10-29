import mongoose, { Schema, models, Document } from 'mongoose';

export interface IRoute extends Document {
  projectId: mongoose.Types.ObjectId;
  url: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const RouteSchema = new Schema<IRoute>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'El ID del proyecto es requerido'],
      index: true,
    },
    url: {
      type: String,
      required: [true, 'La URL de la ruta es requerida'],
      trim: true,
      maxlength: [500, 'La URL no puede exceder 500 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para evitar duplicados de URL por proyecto
RouteSchema.index({ projectId: 1, url: 1 }, { unique: true });

const Route = models.Route || mongoose.model<IRoute>('Route', RouteSchema);

export default Route;
