#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */

// @ts-ignore
import keys from 'lodash/keys';
import {program} from 'commander';
import {
    Keypair, PublicKey,
} from '@solana/web3.js';
import {
    burnTokenAndCloseAccount, getAllNftByCollection,
} from './utils';
import {programs} from '@metaplex/js';
// @ts-ignore
import path from 'path';
import bs58 = require('bs58');
import {getConnection, readPrivateKeyFromKeyPair} from "../utils";
import fs, {appendFileSync} from "fs";
import saveCache from "../saveCache";

const debug = require('debug')('burn-nft-solana-tool:main');

const {
    metadata: {Metadata},
} = programs;

program.version('0.0.1');

program
    .command('burn_nft')
    .requiredOption('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .requiredOption('-n, --nft-address <string>', 'nft address', '--nft-address not provided')
    .action(async (_directory, cmd) => {
        try {
            const {env, keypair, creator, nftAddress} = cmd.opts();
            debug('keypair: ', 
                keypair, 
                'env: ',
                env, 'creator: ',
                creator,
                'nft-address: ',
                nftAddress
            );

            // get connection
            const connection = getConnection(env);
            debug('env: ', env);
            let decodedKey;
            try {
                decodedKey = new Uint8Array(
                    keypair.endsWith('.json') && !Array.isArray(keypair)
                        ? JSON.parse(fs.readFileSync(keypair).toString())
                        : bs58.decode(keypair),
                );
            } catch (e) {
                decodedKey = bs58.decode(readPrivateKeyFromKeyPair(keypair).trim());
            }
            debug('decoded: ', decodedKey);
            const walletKeyPair = Keypair.fromSecretKey(decodedKey);
            const wallet = walletKeyPair.publicKey;


            const tx = await burnTokenAndCloseAccount(nftAddress, wallet, walletKeyPair, connection, 1);
            debug('tx: ', tx)
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error);
        }
    });

program
    .command('get_all_nft_by_collection')
    .requiredOption('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .requiredOption('-c, --collection <string>', 'collection is verified address', '--collection not provided')
    .action(async (_directory, cmd) => {
        try {
            const {env, keypair, collection} = cmd.opts();
            debug(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'nft-address: ',
                collection
            );

            // get connection
            const connection = getConnection(env);
            debug('env: ', env);
            let decodedKey;
            try {
                decodedKey = new Uint8Array(
                    keypair.endsWith('.json') && !Array.isArray(keypair)
                        ? JSON.parse(fs.readFileSync(keypair).toString())
                        : bs58.decode(keypair),
                );
            } catch (e) {
                decodedKey = bs58.decode(readPrivateKeyFromKeyPair(keypair).trim());
            }

            debug('decoded: ', decodedKey);
            const walletKeyPair = Keypair.fromSecretKey(decodedKey);
            const tx = await getAllNftByCollection(connection, walletKeyPair, collection);
            debug('tx: ', tx)
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error);
        }
    });

program
    .command('burn_nft_by_collection')
    .requiredOption('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .requiredOption('-c, --collection <string>', 'collection address', '--collection not provided')
    .requiredOption('-ca, --cache <string>', 'name of cache file', 'cache file')
    .action(async (_directory, cmd) => {
        try {
            const {env, keypair, collection, cache} = cmd.opts();
            debug(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'nft-address: ',
                collection,
                'cache: ',
                cache
            );

            // get connection
            const connection = getConnection(env);
            debug('env: ', env);
            let decodedKey;
            try {
                decodedKey = new Uint8Array(
                    keypair.endsWith('.json') && !Array.isArray(keypair)
                        ? JSON.parse(fs.readFileSync(keypair).toString())
                        : bs58.decode(keypair),
                );
            } catch (e) {
                decodedKey = bs58.decode(readPrivateKeyFromKeyPair(keypair).trim());
            }

            debug('decoded: ', decodedKey);
            const walletKeyPair = Keypair.fromSecretKey(decodedKey);
            const listNft = await getAllNftByCollection(connection, walletKeyPair, collection);
            for (let i = 0; i < listNft.length; i++) {
                const tx = await burnTokenAndCloseAccount(listNft[i], walletKeyPair.publicKey, walletKeyPair, connection, 1);
                debug('tx: ', tx)
                fs.appendFileSync(cache, tx as string + "\n" )
            }
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error);
        }
    });

program.parse(process.argv);

