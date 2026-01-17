export const buildUrlWithParams = (
  baseUrl: string,
  options: Record<string, string | string[]>
) => {
  const queryParams = new URLSearchParams();
  if (!options) {
    return baseUrl;
  }

  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      value.forEach((item) => queryParams.append(key, item));
    } else {
      queryParams.append(key, value);
    }
  }

  return `${baseUrl}?${queryParams}`;
};
