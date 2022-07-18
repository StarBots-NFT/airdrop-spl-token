// @ts-ignore
import * as path from 'path';

import { PublicKey } from '@solana/web3.js';

export const DATA_PATH = path.resolve(__dirname, 'data');
export const CACHE_PATH = path.resolve(__dirname, 'cache');

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const DEFAULT_RETRY_TIME = 8;

export const DISCRIMINATOR_LENGTH = 8;
export const OWNER_ADDRESS_LENGTH = 32;
export const OPENED_LENGTH = 1;
export const ITEM_LENGTH = OWNER_ADDRESS_LENGTH + 5 * OPENED_LENGTH;
export const ITEM_PART_TYPE_LENGTH = 5 * OPENED_LENGTH;
export const OPTION_LENGTH = 1;
export const ENUM_LENGTH = 1;
export const U64_LENGTH = 8;
export const U8_LENGTH = 1;