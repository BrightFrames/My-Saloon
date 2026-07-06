export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: any[];

  constructor(statusCode: number, errorCode: string, message: string, details?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for consistent error handling
  static badRequest(message: string, details?: any[], errorCode = 'BAD_REQUEST') {
    return new ApiError(400, errorCode, message, details);
  }

  static unauthorized(message: string = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, errorCode, message);
  }

  static forbidden(message: string = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new ApiError(403, errorCode, message);
  }

  static notFound(message: string = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new ApiError(404, errorCode, message);
  }

  static internal(message: string = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, errorCode, message);
  }
}
