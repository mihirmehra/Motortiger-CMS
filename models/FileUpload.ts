import mongoose, { Document, Schema } from 'mongoose';

export interface IFileUpload extends Document {
  fileId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
<<<<<<< HEAD
  uploadedBy: string;
=======
  uploadedBy: mongoose.Types.ObjectId;
>>>>>>> 9417930dcf7cbecdcc1e1f2aff48df8a6f088b0a
  module: string;
  targetId?: string;
  isActive: boolean;
}

const FileUploadSchema = new Schema<IFileUpload>({
  fileId: { type: String, unique: true, required: true },
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  module: { 
    type: String, 
    enum: ['leads', 'vendor_orders', 'sales', 'payment_records', 'users'],
    required: true 
  },
  targetId: String,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

FileUploadSchema.index({ fileId: 1 });
FileUploadSchema.index({ uploadedBy: 1 });
FileUploadSchema.index({ module: 1, targetId: 1 });

export default mongoose.models.FileUpload || mongoose.model<IFileUpload>('FileUpload', FileUploadSchema);