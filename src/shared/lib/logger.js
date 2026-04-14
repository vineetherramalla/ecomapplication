const logInDevelopment = (method, args) => {
  if (!import.meta.env.DEV || typeof console?.[method] !== 'function') {
    return;
  }

  console[method](...args);
};

export const logger = {
  error: (...args) => logInDevelopment('error', args),
  warn: (...args) => logInDevelopment('warn', args),
  info: (...args) => logInDevelopment('info', args),
};

export default logger;
