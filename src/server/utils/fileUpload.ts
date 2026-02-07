/**
 * File Upload Utilities
 * Handles image uploads and storage
 */

import { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3000';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// Ensure upload directory exists
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save uploaded file and return public URL
 */
export async function saveUploadedFile(file: MultipartFile): Promise<string> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Generate unique filename
  const ext = file.filename?.split('.').pop() || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  // Ensure directory exists
  await ensureUploadDir();

  // Save file
  const buffer = await file.toBuffer();

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  await writeFile(filepath, buffer);

  // Return public URL
  return `${PUBLIC_URL}/uploads/${filename}`;
}
