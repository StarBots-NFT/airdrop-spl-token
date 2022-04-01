#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */

// @ts-ignore
import keys from 'lodash/keys';
import {program} from 'commander';
import {ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
    Connection,
    ParsedAccountData
} from '@solana/web3.js';
import {
    getMetadataPublicKey,
    findAssociatedTokenAddress,
    readPrivateKeyFromKeyPair,
    readData,
    readCache,
    getConnection,
    readListNftData,
    sendNFTToken,
} from './utils';
import loadCache from './loadCache';
import saveCache from './saveCache';
import fs = require('fs');
import {programs} from '@metaplex/js';
// @ts-ignore
import path from 'path';
import bs58 = require('bs58');

const debug = require('debug')('airdrop-token-solana-tool:main');

const {
    metadata: {Metadata},
} = programs;

program.version('0.0.1');

program
    .command('get_list_nft_minted_by_bot')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .option('-c, --creator <string>', 'creator of nft collection. One of: "GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz" - BOT-collection,' +
        ' "9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj" - SOL collection', "GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz")
    .option('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd) => {
        try {
            const {env, keypair, creator} = cmd.opts();
            console.log(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'creator: ',
                creator,
            );

            // get connection
            const connection = getConnection(env);
            const decoded = bs58.decode(readPrivateKeyFromKeyPair(keypair));
            const walletKeyPair = Keypair.fromSecretKey(decoded);
            const wallet = walletKeyPair.publicKey.toBase58();

            const listToken = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), {
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            })
            for (let i = 0; i < listToken.value.length; i++) {
                const tokenAddress = await connection.getParsedAccountInfo(listToken.value[i].pubkey);
                const tokenData = tokenAddress.value.data;
                const tokenPared = (tokenData as ParsedAccountData).parsed;
                const nftAddress = tokenPared.info.mint;
                const nftAmount = tokenPared.info.tokenAmount.uiAmount;
                if (nftAmount == 1) {
                    const metadataPublicKey = await getMetadataPublicKey(new PublicKey(nftAddress));
                    const nftMetaData = await Metadata.load(connection, metadataPublicKey);
                    const index = nftMetaData.data.data.name.split('#')[1];
                    const tokenCreator = nftMetaData.data.data.creators[0].address
                    if (tokenCreator == creator) {
                        const value = `{"address":"${nftAddress}","id":"${index.toString()}"}\n`
                        fs.appendFile('src/default/nft-bot', value, ()=> {})
                    }
                    console.log('index: ', index)
                }
            }
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error.message);
        }
    });

program
    .command('get_list_nft_minted_by_sol')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .option('-c, --creator <string>', 'creator of nft collection. One of: "GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz" - BOT-collection,' +
        ' "9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj" - SOL collection', "9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj")
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd, keypair) => {
        try {
            const {env, creator} = cmd.opts();
            console.log(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'creator: ',
                creator,
            );

            // get connection
            const connection = getConnection(env);
            const decoded = bs58.decode(readPrivateKeyFromKeyPair(keypair));
            const walletKeyPair = Keypair.fromSecretKey(decoded);
            const wallet = walletKeyPair.publicKey.toBase58();
            const listToken = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), {
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            })
            for (let i = 0; i < listToken.value.length; i++) {
                const tokenAddress = await connection.getParsedAccountInfo(listToken.value[i].pubkey);
                const tokenData = tokenAddress.value.data;
                const tokenPared = (tokenData as ParsedAccountData).parsed;
                const nftAddress = tokenPared.info.mint;
                const nftAmount = tokenPared.info.tokenAmount.uiAmount;
                if (nftAmount == 1) {
                    const metadataPublicKey = await getMetadataPublicKey(new PublicKey(nftAddress));
                    const nftMetaData = await Metadata.load(connection, metadataPublicKey);
                    const index = nftMetaData.data.data.name.split('#')[1];
                    const tokenCreator = nftMetaData.data.data.creators[0].address
                    if (tokenCreator == creator) {
                        console.log('index: ', index)
                        const value = `{"address":"${nftAddress}","id":"${index.toString()}"}\n`
                        fs.appendFile('src/default/nft-sol', value, ()=> {})
                    }
                }
            }
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error.message);
        }
    });

program
    .command('send_nft')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-p, --path-name <string>', 'path contain data', 'default')
    .requiredOption('-k, --keypair <string>', 'Solana wallet location', '--keypair not provided')
    .requiredOption('-sf --sol-file-name <string>', 'path of list nft in Sol collection')
    .requiredOption('-bf --bot-file-name <string>', 'path of list nft in Bot collection')
    .requiredOption('-lw --list-wallet-reciver-name <string>', 'name of list wallet data')
    .action(async (_directory, cmd) => {
        async function sendNFT(
            min: number,
            max: number,
            cache: Record<any, any>,
            walletAddress: string,
            listNFTs: any,
            walletKeyPair: Keypair,
            connection: Connection,
            pathName: string,
        ): Promise<void> {
            for (let b = min; b <= max; b += 1) {
                if (!cache[walletAddress][b]) {
                    const nftAddress = listNFTs[b];
                    if (nftAddress) {
                        debug(`send address ${nftAddress} to ${walletAddress} index ${b}`);
                        // NOTE: using await
                        try {
                            const tx = await sendNFTToken({
                                nftAddress: new PublicKey(nftAddress),
                                reciverAddress: new PublicKey(walletAddress),
                                walletKeyPair: walletKeyPair,
                                connection,
                            });
                            cache[walletAddress][b] = tx;
                            saveCache('cache-nft-sending.json', cache, path.resolve(__dirname, pathName));
                            // eslint-disable-next-line no-empty
                        } catch (e) {
                        }
                    }
                } else {
                    debug(`skip sending address ${b} to ${walletAddress}`);
                }
            }
        }

        try {
            const {keypair, env, pathName, botFileName, solFileName, listWalletReciverName} = cmd.opts();
            // define var
            const connection = getConnection(env);
            const decoded = bs58.decode(readPrivateKeyFromKeyPair(keypair));
            const walletKeyPair = Keypair.fromSecretKey(decoded);

            const botFile = path.resolve(__dirname, pathName, botFileName);
            const solFile = path.resolve(__dirname, pathName, solFileName);
            const listWalletReciver = path.resolve(__dirname, pathName, listWalletReciverName);
            // check input
            fs.access(botFile, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });

            fs.access(solFile, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });

            fs.access(listWalletReciver, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });

            // step 1: list nft from private key
            const listNftsBotText = await readListNftData(botFile).split('\n');
            const listNftsBot = {};
            listNftsBotText.forEach((e) => {
                if (e) {
                    const data = JSON.parse(e);
                    listNftsBot[data.id] = data.address;
                }
            });

            const listNftsSolText = await readListNftData(solFile).split('\n');
            const listNftsSol = {};
            listNftsSolText.forEach((e) => {
                if (e) {
                    console.log('e: ', e)
                    const data = JSON.parse(e);
                    listNftsSol[data.id] = data.address;
                }
            });

            // read cache
            const cacheNFTSending = loadCache('cache-nft-sending.json', path.resolve(__dirname, pathName));

            // step 2: read csv to get list address
            // { address, amount }

            const listWalletData: Record<any, any> = loadCache(listWalletReciver);
            const listWallet = keys(listWalletData);
            for (let i = 0; i < listWallet.length; i += 1) {
                const walletAddress = listWallet[i];
                debug(`sending nft for ${walletAddress}`);

                if (!cacheNFTSending[walletAddress]) {
                    debug(`init ${walletAddress}`);
                    cacheNFTSending[walletAddress] = {};
                }

                const data: Record<any, any> = listWalletData[walletAddress];
                // send sol
                if (data.sol) {
                    await sendNFT(
                        parseInt(data.sol.min),
                        parseInt(data.sol.max),
                        cacheNFTSending,
                        walletAddress,
                        listNftsSol,
                        walletKeyPair,
                        connection,
                        pathName
                    );
                }
                if (data.bot) {
                    await sendNFT(
                        parseInt(data.bot.min),
                        parseInt(data.bot.max),
                        cacheNFTSending,
                        walletAddress,
                        listNftsBot,
                        walletKeyPair,
                        connection,
                        pathName
                    );
                }
            }

            // step 3: send nfts

        } catch (error) {
            console.log(`🚫 failed to transfer with error:`, error);
        }
    });

program.parse(process.argv);

