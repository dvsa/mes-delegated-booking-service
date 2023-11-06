export const isValidAppRef = (applicationReference: number): boolean => {
  const appRefFormat: RegExp = /^[0-9]{11}$/g;
  return appRefFormat.test(String(applicationReference));
};
