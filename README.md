# Tool send multi token to multi user
## Feature:
  - Tool có thể gửi nhiều nft robot đến nhiều người với điều kiện nft robot số bao nhiêu đến cho người nào
## Quickstart:
  ### Prerequisites
  - nodejs: v16.14.0 or newer
  - Yarn: 1.22.17 or newer
  - npm: 8.3.1 or newer
### install
  Install the package via:
```
$ yarn
```
### cache-nft-sending.json:
- To save sent nfts (next run will be ignored)
#### nft-bot:
- List of nft robots purchased by BOT token
```angular2html
{"address":"9qPt8W42dPvXPFt5pn8B1RK34KhD6PTG3p1oPecFRdfV","id":"7455"}
{"address":"663eZwJreVkv4HHUCQvpPkX782712XMEeXTbEhcUHvWa","id":"7584"}
{"address":"AN7XyQUHfHCW5si3eAY48eL7uBXAAH171kVvji8FrSRD","id":"8086"}
{"address":"4XpC8mJ5vs2s1r21KonGN5CpQM6MarVdxrKGAiPvSjfm","id":"7711"}
{"address":"4eEAFwrsiTvsp4ncER4RdpGzY2AcQEChVctfc7YXHHkx","id":"7697"}
```
#### nft-sol:
- List of nft robots purchased by Sol
```angular2html
{"address":"hRBZNdtF4fXTmppJCbJTQ1merJf2wQeBxN9PfasbGM6","id":"2539"}
{"address":"auyFzLNjPZPaCMLuS9cYqbYG6pM6qrT9XtDE1Df1VXk","id":"1676"}
{"address":"DWvrtCgHBQ5GreXZmz3hzaHoLDeNugJYncnxrz2L6kSG","id":"1997"}
{"address":"4VehUsqQCEC2Tbo73UUUhhY3DGTWTDTW4Sccpy8oR6TV","id":"2249"}
{"address":"DsTtCcfpBvczDWSYQtBUyaM8jCSCAfGE1k6am4sPYDWT","id":"2348"}
{"address":"3iweYsugNjgEMJacmTBcGZfaXcCcyoKjhgBLzPq9XLD6","id":"1866"}
{"address":"FTTMTkZCf1vsGQksrez5YdmbvJqfyh8mAU3YFKFWEnLW","id":"2496"}
{"address":"45a4h29h9jtH24HSgvmGbB5dyDBjdy1bo8qPREA1Horq","id":"2200"}
{"address":"H61ra214x5DztRi8dJSYuBtPQoReU49F14fRFdm4yM4J","id":"1846"}
```
### nft-send-data.json:
- List of recipients receive which nft you want to send (nft robots with index from min to max)
- Example content of file nft-send-data.json:
```angular2html
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
  }
}
# user will send to address 52SoVKuj59oR6rcNrkuELLenFmRDzGMGYRc53hS1Gz1P robots with corresponding address in nft-sol file with id from 5801 to 5802 and in nft-bot file with corresponding id 1
```
### data/private-key:
- Private key wallet (dang)
## How to run:
### Step 1:
- if you already have list nft wallet owned (which in SOL-collection and BOT-collection)
please update file: nft-bot and nft-sol. then you can ignore this step

- Get list of nft wallet owned (will automatically fill in the nft-bot, nft-sol file in bash1, so if you want to change the wallet, clear the data in the nft-bot, nft-sol file)
  - e: Devnet or mainnet environment
  - c: Select collection
    - (9rspksNC5fYijBJUdCkpx7AGc9cuMz5vFXze2NKwwLFj)- SOL-collection
    - (GU3J48xaDcRgsCVayhtKMPeDAbfcabqsouv8uM2h4JYz)- BOT-collection
```angular2html
# example
DEBUG=airdrop-token-solana-tool:* yarn get_list_nft_minted_by_sol -e devnet -c CWLGX3UcbxxF1RGwzGoirEVMHZ5hbdRiuhgMrouThXMD -w 3ijKs8Ksp51iQwJdszCEkpxnybRWVyanJCR9
```
```angular2html
# example
$ DEBUG=airdrop-token-solana-tool:* yarn get_list_nft_minted_by_bot -e devnet -c J2t7XbkViQ9QDzcoT3mPHwUoBe6fSEpKrX8ysJWqCFZ1 -w 3ijKs8Ksp51iQwJDSzHyanJCRZb9
```
### Step 2: 
Send nft
preare a file with your expect like as nft-send-data.json example
- keypair: File contains private-key (private key like string - user can get it from Phantom)
- e: Devnet environment, mainnet
- sf: Sol collection file
- bf: Bot collection files
- lw: List of wallets and nfts that will be received
- p: Path of files
```angular2html
# example
$ DEBUG=airdrop-token-solana-tool:* yarn send_nft --keypair ./src/data/private-key -e devnet -sf nft-sol -bf nft-bot -lw nft-send-data.json -p bash1