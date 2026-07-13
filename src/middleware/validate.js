import { errorResponse } from '../utils/apiResponse.js';

export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(422).json({
        success: false,
        message: errors[0]?.message || 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        errors,
      });
    }
    req[target] = result.data;
    next();
  };
};
