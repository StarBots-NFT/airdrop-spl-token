import fs from 'fs';
import path from 'path';
import { CACHE_PATH } from './constants';

export default function saveCache(cacheName: string, cacheContent: Record<any, any>, cPath: string = CACHE_PATH) {
    fs.writeFileSync(path.resolve(cPath, cacheName), JSON.stringify(cacheContent), { flag: 'w' });
}
