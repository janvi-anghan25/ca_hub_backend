export const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message = 'An error occurred', statusCode = 500, errorCode = 'INTERNAL_ERROR') => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
  });
};

export const paginatedResponse = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};
