import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AppError from '../utils/AppError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`, 400, 'INVALID_FILE_TYPE'), false);
  }
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

export const uploadDocument = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: fileFilter([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
}).single('file');

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
}).single('photo');

// Spreadsheet imports are parsed from memory (never persisted to disk).
const importFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls / some .csv
    'text/csv',
    'application/csv',
    'text/plain', // some browsers send this for .csv
    'application/octet-stream', // fallback for .xlsx/.csv
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.xlsx', '.xls', '.csv'];
  if (allowedMimes.includes(file.mimetype) || allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only .xlsx, .xls or .csv files are allowed', 400, 'INVALID_FILE_TYPE'), false);
  }
};

export const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: importFileFilter,
}).single('file');
