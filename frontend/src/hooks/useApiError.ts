export function useApiError() {
  return (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Something went wrong';
  };
}
