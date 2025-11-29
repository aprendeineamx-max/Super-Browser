const targetEnv = process.env.TARGET_ENV;

const enableContributions = process.env.ENABLE_CONTRIBUTIONS === 'true';

const embeddedMode = process.env.EMBEDDED_MODE === 'true';
const advancedUi = process.env.ADVANCED_UI !== 'false';
const logLevel = process.env.LOG_LEVEL || 'info';

const storageRevisions = {
  local: process.env.STORAGE_REVISION_LOCAL,
  session: process.env.STORAGE_REVISION_SESSION
};

const appVersion = process.env.APP_VERSION;

const clientAppVersion = '0.3.0';

const mv3 = process.env.MV3 === 'true';

export {
  targetEnv,
  enableContributions,
  embeddedMode,
  advancedUi,
  logLevel,
  storageRevisions,
  appVersion,
  clientAppVersion,
  mv3
};
