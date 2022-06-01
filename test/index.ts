// @ts-ignore
import path from 'path';
import { equal } from 'assert';
import { test } from 'tap';
import { PublicKey } from '@solana/web3.js';
import {
    findAssociatedTokenAddress,
    readCache,
    readData,
    getMetadataPublicKey,
} from '../src/utils';

test('readData', async () => {
    const result = await readData('./src/data/data.csv');

    test('should be correct length', async () => {
        equal(result.length, 3, 'it should be 3');
    });

    test('check 1st element', async () => {
        equal(
            result[0].address,
            'HWF6wWvChWW3z57pgn59hoPuTgQXVBazAys12Cj8Gied',
            'it should HWF6wWvChWW3z57pgn59hoPuTgQXVBazAys12Cj8Gied',
        );
        equal(result[0].amount, 2, 'it should 2');
    });

    test('check 1st element', async () => {
        equal(
            result[result.length - 1].address,
            'Hyxgnu3tGSGAfx88Ws2qvVoyKdhH89TY9a8ojAAPNPKs',
            'it should Hyxgnu3tGSGAfx88Ws2qvVoyKdhH89TY9a8ojAAPNPKs',
        );
        equal(result[result.length - 1].amount, 1, 'it should 2');
    });
});

test('readData should correct format', async () => {
    const result = await readData('./src/data/data.csv');
    for (let i = 0; i < result.length; i++) {
        equal(result[i].address == null || result[i].address == '', false, 'address should not null or empty');
        equal(result[i].amount == null || result[i].amount <= 0, false, 'amount should not null or > 0');
        equal(typeof result[i].address == 'string', true, 'address should string');
    }
});

test('findAssociatedTokenAddress should be correct', async () => {
    const ata = await findAssociatedTokenAddress({
        walletAddress: new PublicKey('HWF6wWvChWW3z57pgn59hoPuTgQXVBazAys12Cj8Gied'),
        tokenMintAddress: new PublicKey('Bttk9JrwVrHDbSJKtvX5VeeAV7LnkYKKMGX69qDCdCfc'),
    });
    equal(ata, '7bUFzo55TKST9sF2PvMU5kNh4Beqqf8eBA9KQkGpLH2F', 'find ata should be true');
});

test('readCacheDataTest should be correct', async () => {
    const cache = await readCache('cache-data-test.csv');
    const cacheLength = cache.length;
    const firstAddress = cache[0];
    console.log(firstAddress);
    equal(cacheLength, 3, 'cachTest length should be 3');
    equal(
        firstAddress,
        JSON.stringify({ address: 'HWF6wWvChWW3z57pgn59hoPuTgQXVBazAys12Cj8Gied', amount: '2' }),
        'firstAmount length should be 2',
    );
});

test('getMetadataPublicKey should be correct', async () => {
    const metadataPublicKey = await getMetadataPublicKey(new PublicKey('4v7uosfKvPQHYthgraUJTztGkqKwX7saUFrFcKWiBgp6'));
    equal(metadataPublicKey.toBase58(), 'HQf6fEVA6Yuzt5P5rDrwRJLpjJqaA1HtxDmMSj13JGH1', 'publickey should be true');
});
