export const useClassNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};
