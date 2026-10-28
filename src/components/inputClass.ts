export const inputClass = (hasError?: unknown): string =>
  `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
    hasError ? 'border-red focus:ring-red' : 'border-gray-20 focus:ring-primary'
  }`;
