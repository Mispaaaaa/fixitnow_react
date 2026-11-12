import ApiError from '../utils/ApiError.js';

function formatIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

/** Validates req.body and replaces it with the parsed/coerced value. */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.badRequest('Validation failed', formatIssues(result.error.issues)));
    }
    req.body = result.data;
    return next();
  };
}

/** Validates query strings; available to controllers as req.validatedQuery. */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(ApiError.badRequest('Invalid query parameters', formatIssues(result.error.issues)));
    }
    req.validatedQuery = result.data;
    return next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(ApiError.badRequest('Invalid route parameters', formatIssues(result.error.issues)));
    }
    req.params = result.data;
    return next();
  };
}