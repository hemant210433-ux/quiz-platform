/* Minimal logger; silent during tests unless DEBUG_TESTS=1. */
const silent = process.env.NODE_ENV === 'test' && !process.env.DEBUG_TESTS;

const stamp = () => new Date().toISOString();

const logger = {
  info: (...a) => !silent && console.log(`[${stamp()}] INFO`, ...a),
  warn: (...a) => !silent && console.warn(`[${stamp()}] WARN`, ...a),
  error: (...a) => !silent && console.error(`[${stamp()}] ERROR`, ...a),
};

export default logger;
