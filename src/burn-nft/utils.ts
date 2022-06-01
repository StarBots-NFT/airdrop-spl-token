import {Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction} from '@solana/web3.js';
import {Collection, Metadata} from "@metaplex-foundation/mpl-token-metadata";
import {getMetadataPublicKey} from "../utils";


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

export async function getAllNftByCollection(connection: Connection, walletKeyPair: Keypair, collection: PublicKey) {
    const allTokens = await connection.getParsedTokenAccountsByOwner(walletKeyPair.publicKey, {
        programId: TOKEN_PROGRAM_ID
    });
    console.log('wallet: ', walletKeyPair.publicKey.toString());
    const nfts: any[] = [];
    for (let i = 0; i < allTokens.value.length; i++) {
        const info = allTokens.value[i].account.data.parsed.info;
        const tokenAmount = info.tokenAmount;
        if (tokenAmount.decimals == 0 && tokenAmount.amount == 1) {
            const metadataAddress = await getMetadataPublicKey(new PublicKey(info.mint));
            const metadata = await Metadata.load(connection, metadataAddress);
            if (metadata.data.collection && metadata.data.collection.verified && metadata.data.collection.key == collection.toString()) {
                nfts.push(info.mint);
            }
        }
    }
    console.log('list nft: ', nfts)
    console.log('length: ', nfts.length)
    return nfts;
}
