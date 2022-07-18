import {Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction} from '@solana/web3.js';
import {Collection, Metadata} from "@metaplex-foundation/mpl-token-metadata";
import {getMetadataPublicKey} from "../utils";
import {DEFAULT_RETRY_TIME} from "../constants";
import {decodeIndex, decodeItem, getTotal, Item} from "./schema";

export async function burnTokenAndCloseAccount(tokenMintAddress: string, owner: PublicKey, walletKeyPair: Keypair, connection: Connection, amount: number) {
    try {
        const mintPublickey = new PublicKey(tokenMintAddress);

        const associatedAddress = await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mintPublickey,
            owner,
        );

        const burnInstruction = await Token.createBurnInstruction(
            TOKEN_PROGRAM_ID,
            mintPublickey,
            associatedAddress,
            owner,
            [],
            amount
        );

        const closeInstruction = await Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            associatedAddress,
            owner,
            owner,
            []
        );

        const BurnandCloseTransaction = new Transaction().add(burnInstruction, closeInstruction);

        const signature = await sendAndConfirmTransaction(connection, BurnandCloseTransaction, [walletKeyPair], {
            commitment: 'processed',
        });
        console.log('signature: ', signature)
        return signature;
    } catch (error) {
        console.log(error)
    }
}

export async function getAllNftByCollection(connection: Connection, walletPubkey: PublicKey, collection: PublicKey) {
    const allTokens = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID
    });
    const nfts: any[] = [];
    const nftIndex = [];
    let sum =0
    for (let i = 0; i < allTokens.value.length; i++) {
        const info = allTokens.value[i].account.data.parsed.info;
        const tokenAmount = info.tokenAmount;
        if (tokenAmount.decimals == 0 && tokenAmount.amount == 1) {
            const metadataAddress = await getMetadataPublicKey(new PublicKey(info.mint));
            const metadata = await Metadata.load(connection, metadataAddress);
            if (metadata.data.collection && metadata.data.collection.verified && metadata.data?.collection.key == collection.toString()) {
                nfts.push(info.mint);
                nftIndex.push(Number(metadata.data.data.name.split('#')[1]) - 1);
                sum = sum + 1;
            }
        }
    }
    console.log('sum: ', sum)
    return {listNft: nfts, nftIndex: nftIndex};
}

export async function logAllItemsInPage(
    pageIndexer: PublicKey,
    connection: Connection,
    max: number,
) {
    console.log(max, 'max');
    let isStop = false;
    const listItem: Item[] = [];
    while (!isStop) {
        // Check if the greeting account has already been created
        const pageIndexerAccount =
            await connection.getAccountInfo(pageIndexer);

        if (pageIndexerAccount === null) {
            isStop = true;
        } else {
            // logs
            let dataPage: any =
                await connection.getAccountInfo(pageIndexer);
            dataPage = [...dataPage.data];
            const decodeindex = decodeIndex(dataPage);
            console.log('index ', decodeindex.toObject());
            for (let i = 0; i < max; i++) {
                const decodeindex = decodeItem(dataPage, i);
                listItem.push(decodeindex)
            }
            isStop = true;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }
    return listItem;
}

export type RetryFunctionParams = {
    func: any,
    retryTime?: number,
    retryIndex?: number
}

export async function retryFunction(
    {
        func,
        retryTime = DEFAULT_RETRY_TIME,
        retryIndex = 0,
    }: RetryFunctionParams,
    ...params: any
) {
    const reTryIndex = retryIndex;
    const awaitTime = (Math.pow(2, reTryIndex) + Math.random()) * 1000
    try {
        await sleep(awaitTime)
        return await func(...params)
    } catch (e: any) {
        if (retryIndex < retryTime) {
            const rs = await retryFunction({ func, retryTime: retryTime, retryIndex: retryIndex + 1 }, ...params)
            return rs
        } else throw new Error(e.message)
    }
}

const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};


export async function getAllIndexRobotMinted() {

}
