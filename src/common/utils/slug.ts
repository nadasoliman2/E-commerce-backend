export const generateSlug = (value: string): string => {
  return value.replaceAll(/\s+/g, '-')
}