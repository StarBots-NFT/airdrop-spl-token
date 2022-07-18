#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */

// @ts-ignore
import keys from 'lodash/keys';
import {program} from 'commander';
import {
    Keypair, PublicKey,
} from '@solana/web3.js';
import {
    burnTokenAndCloseAccount, getAllIndexRobotMinted, getAllNftByCollection, logAllItemsInPage,
} from './utils';
import {programs} from '@metaplex/js';
// @ts-ignore
import path from 'path';
import bs58 = require('bs58');
import {getConnection, getMetadataPublicKey, readPrivateKeyFromKeyPair} from "../utils";
import * as fs from "fs";
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
            const tx = await getAllNftByCollection(connection, walletKeyPair.publicKey, collection);
            debug('tx: ', tx)
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error);
        }
    });

program
    .command('get_all_index_of_robot_minted')
    .requiredOption('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd) => {
        try {
            const {env, keypair} = cmd.opts();
            debug(
                'keypair: ',
                keypair,
                'env: ',
                env,
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
            const pageIndex = new PublicKey('7fE2DivksgE4jmA7hJ7hn9GYnXcsXV1sbcUEiEcUC8KC')
            const listItem = await logAllItemsInPage(pageIndex, connection, 10000);
            debug('tx: ', listItem.length)
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
    .requiredOption('-f, --file <path>', 'name of list nfts file', 'nft-address file')
    .action(async (_directory, cmd) => {
        try {
            const {env, keypair, collection, cache, file} = cmd.opts();
            debug(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'nft-address: ',
                collection,
                'cache: ',
                cache,
                'file: ',
                file
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
                decodedKey = bs58.decode(readPrivateKeyFromKeyPair(keypair).trim());
            }

            debug('decoded: ', decodedKey);
            const walletKeyPair = Keypair.fromSecretKey(decodedKey);
            const listNft = fs.readFileSync(file, 'utf-8').split('\n');
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

