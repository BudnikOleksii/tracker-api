export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !Number.isNaN(date.getTime());
};

export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (!isValidDate(date)) {
    throw new Error('Invalid date string');
  }

  return date;
};
