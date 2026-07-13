import logger from '../utils/logger.js';

const handleMongooseCastError = (err) => ({
  message: `Invalid ${err.path}: ${err.value}`,
  statusCode: 400,
  errorCode: 'INVALID_ID',
});

const handleMongooseDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return {
    message: `${field} already exists`,
    statusCode: 409,
    errorCode: 'DUPLICATE_KEY',
  };
};

const handleMongooseValidationError = (err) => ({
  message: Object.values(err.errors)
    .map((e) => e.message)
    .join('. '),
  statusCode: 422,
  errorCode: 'VALIDATION_ERROR',
});

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR' } = err;

  if (err.name === 'CastError') {
    ({ message, statusCode, errorCode } = handleMongooseCastError(err));
  } else if (err.code === 11000) {
    ({ message, statusCode, errorCode } = handleMongooseDuplicateKey(err));
  } else if (err.name === 'ValidationError') {
    ({ message, statusCode, errorCode } = handleMongooseValidationError(err));
  } else if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    message = 'Token has expired';
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
  }

  if (statusCode >= 500) {
    logger.error('Unhandled error:', { message: err.message, stack: err.stack, url: req.originalUrl });
  }

  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 ? 'Something went wrong' : message,
    errorCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
