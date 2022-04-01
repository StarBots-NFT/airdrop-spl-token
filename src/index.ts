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
    .command('send_token_to_user')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .option('-k, --keypair <path>', 'keypair of wallet', '')
    .requiredOption('-a --account <string>', 'account address of receiver')
    .option('-am, --amount <string>', 'number of token transfer', '1')
    .requiredOption(
        '-ta, --token-address <string>',
        'address of token transfer',
    )
    .requiredOption('-d, --decimals <string>', 'decimals of token')
    .action(async (_directory, cmd) => {
        try {
            const {keypair, env, tokenAddress, amount, account, decimals} = cmd.opts();
            console.log(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'tokenAddress: ',
                tokenAddress,
                'account: ',
                account,
                'ammount: ',
                amount,
                'decimals: ',
                decimals,
            );
            const tokenAddressPub = new PublicKey(tokenAddress);
            // get connection
            const connection = getConnection(env);

            const decoded = bs58.decode(readPrivateKeyFromKeyPair(keypair));

            const walletKeyPair = Keypair.fromSecretKey(decoded);

            const accountAddress = new PublicKey(account);
            const fromTokenAccount = await findAssociatedTokenAddress({
                walletAddress: walletKeyPair.publicKey,
                tokenMintAddress: tokenAddressPub,
            });

            const token = new Token(connection, tokenAddressPub, TOKEN_PROGRAM_ID, walletKeyPair);
            const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(accountAddress);
            // const toTokenAccount = await findAssociatedTokenAddress(account, token);
            console.log('toToken: ', toTokenAccount.address.toBase58());
            const numbOfDecimals = Math.pow(10, decimals);
            const transaction = new Transaction().add(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    fromTokenAccount,
                    toTokenAccount.address,
                    walletKeyPair.publicKey,
                    [],
                    amount * numbOfDecimals,
                ),
            );

            const signature = await sendAndConfirmTransaction(connection, transaction, [walletKeyPair], {
                commitment: 'confirmed',
            });
            console.log('SIGNATURE', signature);
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error.message);
        }
    });


program
    .command('send_token')
    .requiredOption('-f --file <path>', 'file list send token')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .option('-k, --keypair <path>', 'keypair of wallet', '')
    .requiredOption(
        '-ta, --token-address <string>',
        'address of token transfer',
    )
    .requiredOption('-d, --decimals <string>', 'decimals of token') // 8 with BOT token
    .action(async (_directory, cmd) => {
        try {
            const {keypair, env, tokenAddress, file, decimals} = cmd.opts();
            console.log(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'tokenAddress: ',
                tokenAddress,
                'file: ',
                file,
                'decimals: ',
                decimals,
            );
            const connection = getConnection(env);
            const tokenAddressPub = new PublicKey(tokenAddress);
            const decoded = bs58.decode(readPrivateKeyFromKeyPair(keypair));
            const walletKeyPair = Keypair.fromSecretKey(decoded);
            const token = new Token(connection, tokenAddressPub, TOKEN_PROGRAM_ID, walletKeyPair);

            const fromTokenAccount = await findAssociatedTokenAddress({
                walletAddress: walletKeyPair.publicKey,
                tokenMintAddress: tokenAddressPub,
            });
            const listAddress = await readData(file);
            const fileName = file.split('/');
            const name = fileName[fileName.length - 1];
            const cacheFile = 'cache-' + name;
            let cache = [];
            cache = await readCache(cacheFile);
            for (let i = 0; i < listAddress.length; i++) {
                if (cache.includes(JSON.stringify(listAddress[i]))) {
                    console.log('sended: ', JSON.stringify(listAddress[i]));
                } else {
                    const accountAddress = new PublicKey(listAddress[i].address);
                    const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(accountAddress);
                    const numbOfDecimals = Math.pow(10, decimals);
                    const transaction = new Transaction().add(
                        Token.createTransferInstruction(
                            TOKEN_PROGRAM_ID,
                            fromTokenAccount,
                            toTokenAccount.address,
                            walletKeyPair.publicKey,
                            [],
                            listAddress[i].amount * numbOfDecimals,
                        ),
                    );
                    const signature = await sendAndConfirmTransaction(connection, transaction, [walletKeyPair], {
                        commitment: 'processed',
                    });
                    fs.appendFileSync(cacheFile + '-tx', signature + '\n');
                    fs.appendFileSync(cacheFile, JSON.stringify(listAddress[i]) + '\n');
                    console.log('send to: ', JSON.stringify(listAddress[i]));
                }
            }
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error.message);
        }
    });

program
    .command('send_nft_to_user')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-a --account <string>', 'account address of receiver')
    .option('-am, --amount <string>', 'number of token transfer', '1')
    .requiredOption('-c, --creator <string>', 'creator of nft')
    // .option('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd) => {
        try {
            const {keypair, env, amount, account, creator} = cmd.opts();
            console.log(
                'keypair: ',
                keypair,
                'env: ',
                env,
                'account: ',
                account,
                'ammount: ',
                amount,
                'creator: ',
                creator,
            );

            // get connection
            const connection = getConnection(env);

            // get wallet
            const decoded = bs58.decode(readPrivateKeyFromKeyPair(keypair));
            const walletKeyPair = Keypair.fromSecretKey(decoded);
            console.log('walletKeyPair: ', walletKeyPair.publicKey.toString());
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletKeyPair.publicKey, {
                programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            });
            let listNFTS = [];
            for (const e of tokenAccounts.value) {
                const nftAddress = e.account.data.parsed.info.mint;
                const metadataPublicKey = await getMetadataPublicKey(new PublicKey(nftAddress));
                try {
                    const metaData = await Metadata.load(connection, metadataPublicKey);
                    if (metaData.data.data.creators[0].address == creator) {
                        listNFTS.push(nftAddress);
                        console.log('listNFTs length: ', listNFTS.length);
                    }
                } catch (e) {
                    console.log(e);
                }
            }

            for (let i = 0; i < 1; i++) {
                if (listNFTS.length > 0) {
                    const index = Math.floor(Math.random() * listNFTS.length);
                    console.log('nft index: ', index);
                    console.log('nftAddressPub address: ', listNFTS[index]);
                    console.log('walletKeyPair address: ', walletKeyPair.publicKey.toString());
                    const nftAddressPub = new PublicKey('aZ6gBRHemSFxejQKsmCge2RsqnHSPqhp75fK4h47Wps');
                    const accountAddress = new PublicKey(account);
                    const fromTokenAccount = await Token.getAssociatedTokenAddress(
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                        TOKEN_PROGRAM_ID,
                        nftAddressPub,
                        walletKeyPair.publicKey,
                    );
                    const token = new Token(connection, nftAddressPub, TOKEN_PROGRAM_ID, walletKeyPair);
                    const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(accountAddress);
                    const transaction = new Transaction().add(
                        Token.createTransferInstruction(
                            TOKEN_PROGRAM_ID,
                            fromTokenAccount,
                            toTokenAccount.address,
                            walletKeyPair.publicKey,
                            [],
                            1,
                        ),
                    );

                    const signature = await sendAndConfirmTransaction(connection, transaction, [walletKeyPair], {
                        commitment: 'confirmed',
                    });
                    console.log('SIGNATURE', signature);
                    listNFTS = listNFTS.filter((e) => e != nftAddressPub);
                    console.log(listNFTS);
                }
            }
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error.message);
        }
    });

program
    .command('get_list_nft_minted_by_bot')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-w --wallet <string>', 'wallet address to get list')
    .option('-c, --creator <string>', 'creator of nft collection. One of: "GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz" - BOT-collection,' +
        ' "9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj" - SOL collection', "9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj")
    // .option('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd) => {
        try {
            const {env, wallet, creator} = cmd.opts();
            console.log(
                'wallet: ',
                wallet,
                'env: ',
                env,
                'creator: ',
                creator,
            );

            // get connection
            const connection = getConnection(env);

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
                        const value = `{"address":${nftAddress},"id":${index.toString()}}\n`
                        fs.appendFile('src/bash1/nft-bot', value, ()=> {})
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
    .requiredOption('-w --wallet <string>', 'wallet address to get list')
    .option('-c, --creator <string>', 'creator of nft collection. One of: "GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz" - BOT-collection,' +
        ' "9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj" - SOL collection', "GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz")
    // .option('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd) => {
        try {
            const {env, wallet, creator} = cmd.opts();
            console.log(
                'wallet: ',
                wallet,
                'env: ',
                env,
                'creator: ',
                creator,
            );

            // get connection
            const connection = getConnection(env);

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
                        const value = `{"address":${nftAddress},"id":${index.toString()}}\n`
                        fs.appendFile('src/bash1/nft-sol', value, ()=> {})
                    }
                    console.log('index: ', index)
                }
            }
        } catch (error) {
            console.warn(`🚫 failed to transfer with error:`, error.message);
        }
    });

program
    .command('send_nft')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-p, --path-name <string>', 'path chua data', 'data')
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
            console.log('wallet: ', walletKeyPair.publicKey.toBase58());

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

