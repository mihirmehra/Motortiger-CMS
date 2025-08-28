import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateFileId } from './idGenerator';

export interface UploadedFile {
  fileId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export async function handleFileUpload(
  request: NextRequest,
  module: string,
  targetId?: string
): Promise<UploadedFile[]> {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', module);
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      const fileId = generateFileId();
      const fileName = `${fileId}_${file.name}`;
      const filePath = join(uploadDir, fileName);
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
<<<<<<< HEAD
      await writeFile(filePath, buffer);
=======
      const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      
      await writeFile(filePath, uint8Array);
>>>>>>> 9417930dcf7cbecdcc1e1f2aff48df8a6f088b0a

      uploadedFiles.push({
        fileId,
        originalName: file.name,
        fileName,
        filePath: `/uploads/${module}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type
      });
    }

    return uploadedFiles;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('File upload failed');
  }
}

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}