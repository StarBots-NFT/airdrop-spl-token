# Tool send multi token to multi user

## Feature:

This tool can send multi robots to multi users in condition you have to note clearly which NFT (NFT number) to whom you want to receive

## Quickstart:

### Prerequisites

  - nodejs: v16.14.0 or newer
  - Yarn: 1.22.17 or newer
  - npm: 8.3.1 or newer

### install
  Install the package via:

```sh
yarn
```

## How to run send_nft:

### Step 1:

- Get list of BOT-collection nft wallet owned (will automatically fill in the nft-bot file in default)
    - e: Env to run command: devnet, mainnet-beta, test-net
    - c: Select collection
      - (9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj)- SOL-collection
      - (GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz)- BOT-collection

```shell
DEBUG=airdrop-token-solana-tool:* yarn get_list_nft_minted_by_bot -e mainnet-beta -c GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz
```
After running step 1 go to default/nft-bot to see your NFTs in BOT-collection
### Step 2:

- Get list of SOL-collection nft wallet owned (will automatically fill in the nft-sol file in default)
  - e: Env to run command: devnet, mainnet-beta, test-net
  - c: Select collection
    - (9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj)- SOL-collection
    - (GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz)- BOT-collection
```shell
DEBUG=airdrop-token-solana-tool:* yarn get_list_nft_minted_by_sol -e mainnet-beta -c 9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj
```
After running step 2 go to default/nft-sol to see your NFTs in SOL-collection
### Step 3:

- Update file src/default/nft-send-data.json:
    - List of recipients receive which nft you want to send (The number of nft robots from min to max)
    - Example content of file nft-send-data.json:
```shell
{
  "52SoVKuj59oR6rcNrkuELLenFmRDzGMGYRc53hS1Gz1P":{
    "sol":{
      "min":5801,
      "max":5802
    },
    "bot":{
      "min":1,
      "max":1
    }
  },
  .....
}
# user will send to address 52SoVKuj59oR6rcNrkuELLenFmRDzGMGYRc53hS1Gz1P robots with corresponding address in nft-sol file with id from 5801 to 5802 and in nft-bot file with corresponding id 1
```

### Step 4: 

Send nft to your expected person based on the file you made in step 3
- keypair: File contains private-key (private key like string - user can get it from Phantom)
- e: Devnet environment, mainnet
- sf: Sol collection file
- bf: Bot collection files
- lw: List of wallets and nfts that will be received

```sh
DEBUG=airdrop-token-solana-tool:* yarn send_nft --keypair ./src/data/private-key -e mainnet-beta -sf nft-sol -bf nft-bot -lw nft-send-data.json
```


## How to run burn_nft:

### command burn 1 nft:
```bash
DEBUG=burn-nft-solana-tool:* ts-node src/burn-nft/index.ts burn_nft -e <env> -k <path_of_key_pair> -n <nft_address>
```

```javascript
.command('burn_nft')
    .requiredOption('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .requiredOption('-n, --nft-address <string>', 'nft address', '--nft-address not provided')
```


### command get all nft by collection:

```bash
DEBUG=burn-nft-solana-tool:* ts-node src/burn-nft/index.ts get_all_nft_by_collection -e <env> -k <path_of_keypair> -c <collection_address>
```

```javascript
.command('get_all_nft_by_collection')
    .requiredOption('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .requiredOption('-c, --collection <string>', 'collection is verified address', '--collection not provided')
```

### command burn_nft_by_collection:

```bash
DEBUG=burn-nft-solana-tool:* ts-node src/burn-nft/index.ts burn_nft_by_collection -e <env> -k <keypair_path> -c <collection_address> -cache <cache_file_name>
```

```javascript
.command('burn_nft_by_collection')
    .requiredOption('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .requiredOption('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .requiredOption('-c, --collection <string>', 'collection address', '--collection not provided')
    .requiredOption('-ca, --cache <string>', 'name of cache file', 'cache file')
```
