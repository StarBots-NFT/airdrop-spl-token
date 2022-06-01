
// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';
import {
    Cluster,
    clusterApiUrl,
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction,
} from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// @ts-ignore
import csv from 'csv-parser';
import { TOKEN_METADATA_PROGRAM_ID } from './constants';
import saveCache from "./saveCache";

const RPC_CLUSTER_SERUM = 'https://solana-api.projectserum.com';
// const RPC_CLUSTER_DEV = 'https://api.devnet.solana.com';
// const RPC_CLUSTER = RPC_CLUSTER_DEV;
const RPC_CLUSTER = RPC_CLUSTER_SERUM;

const debug = require('debug')('airdrop-token-solana-tool:util');

export function getConnection(env: string) {
    const cluster = env === 'mainnet-beta' ? RPC_CLUSTER : clusterApiUrl(env as Cluster);
    const connection = new Connection(cluster);
    return connection;
}

export function readPrivateKeyFromKeyPair(file?: string) {
    if (!file) {
        file = path.resolve(__dirname, 'data', 'private-key');
    }
    return fs.readFileSync(file).toString();
}

type FindingAssociatedTokenAddressParams = {
    walletAddress: PublicKey;
    tokenMintAddress: PublicKey;
};

export async function findAssociatedTokenAddress({
    walletAddress,
    tokenMintAddress,
}: FindingAssociatedTokenAddressParams): Promise<PublicKey> {
    const [address, _] = await PublicKey.findProgramAddress(
        [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    return address;
}

type MapingAddress = {
    address: string;
    amount: number;
};

export function readData(file?: any): Promise<MapingAddress[]> {
    return new Promise((resolve, reject) => {
        const infoAccount: any[] = [];
        fs.createReadStream(file)
            .pipe(csv())
            .on('data', (row) => {
                infoAccount.push(row);
            })
            .on('end', () => {
                resolve(infoAccount);
            })
            .on('error', () => {
                reject;
            });
    });
}

export function readListNftData(file?: any) {
    const infoNFT = fs.readFileSync(file, 'utf8');
    return infoNFT;
}

export function readCache(cacheFile?: any): Promise<MapingAddress[]> {
    return new Promise((resolve) => {
        let cache: any[] = [];
        if (fs.existsSync(cacheFile)) {
            fs.readFile(cacheFile, 'utf8', (err: any, data: string) => {
                if (err) {
                    console.error(err);
                    return;
                }
                cache = data.split('\n');
                console.log('cache size: ', cache.length);
                resolve(cache);
            });
        } else {
            resolve([]);
        }
    });
}

export async function getMetadataPublicKey(mint: PublicKey): Promise<PublicKey> {
    return (
        await PublicKey.findProgramAddress(
            [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
}

type SendingNFTTokenParams = {
    nftAddress: PublicKey;
    reciverAddress: PublicKey;
    walletKeyPair: Keypair;
    connection: Connection;
};

export async function sendNFTToken({
    nftAddress,
    reciverAddress,
    walletKeyPair,
    connection,
}: SendingNFTTokenParams): Promise<string> {
    let signature = 'err';
    let check = true;
    let retry = 0;
    while (check && retry < 5) {
        try {
            check = false;
            signature = await send({ nftAddress, reciverAddress, walletKeyPair, connection });
        } catch (e) {
            console.log('retry: ', retry);
            await sleep(5000);
            retry = retry + 1;
            check = true;
        }
    }
    return signature;
}

export async function send({ nftAddress, reciverAddress, walletKeyPair, connection }: SendingNFTTokenParams) {
    const fromTokenAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        nftAddress,
        walletKeyPair.publicKey,
    );

    const token = new Token(connection, nftAddress, TOKEN_PROGRAM_ID, walletKeyPair);
    const toTokenAccount = await token.getOrCreateAssociatedAccountInfo(reciverAddress);
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
    debug(
        'send nft %s from %s to %s',
        nftAddress.toString(),
        walletKeyPair.publicKey.toBase58(),
        reciverAddress.toBase58(),
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [walletKeyPair], {
        commitment: 'processed',
    });
    return signature;
}

function sleep(time: any) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

