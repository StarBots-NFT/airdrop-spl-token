import fs from 'fs';
import path from 'path';
import { CACHE_PATH } from './constants';

export default function loadCache(cacheName: string, cPath: string = CACHE_PATH) {
    return JSON.parse(fs.readFileSync(path.resolve(cPath, cacheName), { encoding: 'utf8', flag: 'r' }));
}
