/**
 * Storage facade. Everything else in the app imports from here.
 *
 *   MONGODB_URI set (and NODE_ENV != test)  -> MongoDB Atlas   (use this on Render)
 *   otherwise                               -> JSON files in DATA_DIR (local dev / tests)
 */
import config from '../config/index.js';
import * as fileStore from './fileStore.js';
import * as mongoStore from './mongoStore.js';

const driver = config.useMongo ? mongoStore : fileStore;

export const usingMongo = config.useMongo;
export const initStorage = driver.initStorage;
export const closeStorage = driver.closeStorage;
export const getDataDir = driver.getDataDir;
export const describeStorage = driver.describeStorage;
export const readJson = driver.readJson;
export const writeJson = driver.writeJson;
export const updateJson = driver.updateJson;
export const deletePath = driver.deletePath;
export const exists = driver.exists;
export const listJsonFiles = driver.listJsonFiles;
export const collectDataFiles = driver.collectDataFiles;
export const listFilesMeta = driver.listFilesMeta;
export const clearDirs = driver.clearDirs;

// File-store only helpers (used by tests); harmless no-ops with MongoDB.
export const setDataDir = fileStore.setDataDir;
export const resolvePath = fileStore.resolvePath;
export const ensureDir = fileStore.ensureDir;
