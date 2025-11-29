import {storageRevisions} from 'utils/config';
import {
  storageGet as safeGet,
  storageSet as safeSet,
  storageRemove as safeRemove,
  storageClear as safeClear
} from 'utils/browser-client';

async function isStorageArea({area = 'local'} = {}) {
  try {
    await safeGet('', {area});
    return true;
  } catch (err) {
    return false;
  }
}

const storageReady = {local: false, session: false, sync: false};
async function isStorageReady({area = 'local'} = {}) {
  if (storageReady[area]) {
    return true;
  } else {
    const {storageVersion} = await safeGet('storageVersion', {area});
    if (storageVersion && storageVersion === storageRevisions[area]) {
      storageReady[area] = true;
      return true;
    }
  }

  return false;
}

async function ensureStorageReady({area = 'local'} = {}) {
  if (!storageReady[area]) {
    return new Promise((resolve, reject) => {
      let stop;

      const checkStorage = async function () {
        if (await isStorageReady({area})) {
          self.clearTimeout(timeoutId);
          resolve();
        } else if (stop) {
          reject(new Error(`Storage (${area}) is not ready`));
        } else {
          self.setTimeout(checkStorage, 30);
        }
      };

      const timeoutId = self.setTimeout(function () {
        stop = true;
      }, 60000); // 1 minute

      checkStorage();
    });
  }
}

async function get(keys = null, {area = 'local'} = {}) {
  await ensureStorageReady({area});
  return safeGet(keys, {area});
}

async function set(obj, {area = 'local'} = {}) {
  await ensureStorageReady({area});
  return safeSet(obj, {area});
}

async function remove(keys, {area = 'local'} = {}) {
  await ensureStorageReady({area});
  return safeRemove(keys, {area});
}

async function clear({area = 'local'} = {}) {
  await ensureStorageReady({area});
  return safeClear({area});
}

export default {get, set, remove, clear};
export {isStorageArea, isStorageReady, ensureStorageReady};
