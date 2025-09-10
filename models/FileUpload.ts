import mongoose, { Document, Schema } from 'mongoose';
import { toZonedTime } from 'date-fns-tz';

const getFontanaTime = () => {
  const now = new Date(); // This is the server's time (e.g., UTC)
  const fontanaTimeZone = 'America/Los_Angeles';
  // Convert the current time to the specified time zone
  return toZonedTime(now, fontanaTimeZone);
};

export interface IFileUpload extends Document {
  fileId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: mongoose.Types.ObjectId;
  module: string;
  targetId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  isActive: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: getFontanaTime,
  },
  updatedAt: {
    type: Date,
    default: getFontanaTime,
  },
});

FileUploadSchema.pre('save', function (next) {
  this.updatedAt = getFontanaTime();
  next();
});

FileUploadSchema.index({ fileId: 1 });
FileUploadSchema.index({ uploadedBy: 1 });
FileUploadSchema.index({ module: 1, targetId: 1 });

export default mongoose.models.FileUpload || mongoose.model<IFileUpload>('FileUpload', FileUploadSchema);