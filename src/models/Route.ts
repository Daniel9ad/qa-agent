import mongoose, { Schema, models, Document } from 'mongoose';

export interface IRoute extends Document {
  projectId: mongoose.Types.ObjectId;
  path: string;
  url: string;
  title?: string;
  description: string;
  id_vdb?: string; // ID o índice en la base de datos vectorial (Qdrant)
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
    path: {
      type: String,
      required: [true, 'La ruta es requerida'],
      trim: true,
      maxlength: [500, 'La ruta no puede exceder 500 caracteres'],
    },
    url: {
      type: String,
      required: [true, 'La URL de la ruta es requerida'],
      trim: true,
      maxlength: [500, 'La URL no puede exceder 500 caracteres'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [500, 'El título no puede exceder 500 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [10000, 'La descripción no puede exceder 10000 caracteres'],
      default: '',
    },
    id_vdb: {
      type: String,
      trim: true,
      maxlength: [500, 'El ID VDB no puede exceder 500 caracteres'],
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
