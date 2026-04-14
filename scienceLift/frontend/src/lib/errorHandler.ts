/**
 * Utility function to extract readable error messages from API responses
 */

export function getErrorMessage(error: any): string {
  // If error has a response with data
  if (error.response?.data) {
    const data = error.response.data;

    // If it's a string detail message
    if (typeof data.detail === 'string') {
      return data.detail;
    }

    // If detail is an array of validation errors (Pydantic)
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((err: any) => {
          if (typeof err === 'string') return err;
          if (err.msg) return err.msg;
          return 'Validation error';
        })
        .join(', ');
    }

    // If detail is an object with msg property
    if (typeof data.detail === 'object' && data.detail?.msg) {
      return data.detail.msg;
    }

    // Generic error message from data
    if (data.message) return data.message;
    if (data.error) return data.error;
  }

  // Fallback to error message
  if (error.message) return error.message;

  return 'An error occurred. Please try again.';
}
