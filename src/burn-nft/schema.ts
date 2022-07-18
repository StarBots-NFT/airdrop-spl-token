import {deserializeUnchecked} from 'borsh';
import * as BN from "bn.js";
import {retryFunction} from "./utils";
import {
  DISCRIMINATOR_LENGTH,
  ENUM_LENGTH,
  ITEM_LENGTH,
  ITEM_PART_TYPE_LENGTH,
  OPTION_LENGTH,
  OWNER_ADDRESS_LENGTH, U64_LENGTH, U8_LENGTH
} from "../constants";
import {Connection, PublicKey} from "@solana/web3.js";

export class Total {
  total: number;

  constructor(args: { total: number }) {
    this.total = args.total;
  }

  toLog() {
    return {
      total: this.total,
    };
  }
}

export class PartTotal {
  authority: string;
  total: number;

  constructor(args: { authority: string, total: number }) {
    this.authority = args.authority
    this.total = args.total;
  }

  toLog() {
    return {
      total: this.total,
      authority: this.authority
    };
  }
}

export class Config {
  // index: ProgramState;
  index: number;

  constructor(args: { index: number }) {
    this.index = args.index;
  }

  toObject() {
    return {
      index: this.index,
    };
  }
}

export class TokenInfo {
  token_address: string;
  bot_fee: BN;
  gear_fee: BN;
  box_type: BN;

  constructor(args: {
    token_address: string,
    bot_fee: BN,
    gear_fee: BN,
    box_type: BN,
  }) {
    this.token_address = args.token_address;
    this.bot_fee = args.bot_fee;
    this.gear_fee = args.gear_fee;
    this.box_type = args.box_type;
  }

  toObject() {
    return {
      token_address: this.token_address,
      bot_fee: (this.bot_fee as BN).toNumber(),
      gear_fee: (this.gear_fee as BN).toNumber(),
      box_type: this.box_type,
    };
  }
}

export class Item {
  owner: string;
  opened_body: BN;
  opened_wheel1: BN;
  opened_wheel2: BN;
  opened_weapon: BN;
  opened_gadget: BN;

  constructor(args: {
    owner: string;
    opened_body: BN;
    opened_wheel1: BN;
    opened_wheel2: BN;
    opened_weapon: BN;
    opened_gadget: BN;
  }) {
    this.owner = args.owner;
    this.opened_body = args.opened_body;
    this.opened_wheel1 = args.opened_wheel1;
    this.opened_wheel2 = args.opened_wheel2;
    this.opened_weapon = args.opened_weapon;
    this.opened_gadget = args.opened_gadget;
  }

  toObject() {
    return {
      owner: this.owner,
      opened_body: this.opened_body,
      opened_wheel1: this.opened_wheel1,
      opened_wheel2: this.opened_wheel2,
      opened_weapon: this.opened_weapon,
      opened_gadget: this.opened_gadget,
    };
  }
}

export class PartItem {
  index_body: BN;
  index_wheel1: BN;
  index_wheel2: BN;
  index_weapon: BN;
  index_gadget: BN;

  constructor(args: {
    index_body: BN;
    index_wheel1: BN;
    index_wheel2: BN;
    index_weapon: BN;
    index_gadget: BN;
  }) {
    this.index_body = args.index_body;
    this.index_wheel1 = args.index_wheel1;
    this.index_wheel2 = args.index_wheel2;
    this.index_weapon = args.index_weapon;
    this.index_gadget = args.index_gadget;
  }

  toObject() {
    return {
      index_body: this.index_body,
      index_wheel1: this.index_wheel1,
      index_wheel2: this.index_wheel2,
      index_weapon: this.index_weapon,
      index_gadget: this.index_gadget,
    };
  }
}

export const SCHEMA = new Map<any, any>([
  [
    Item,
    {
      kind: 'struct',
      fields: [
        ['owner', 'pubkeyAsString'],
        ['opened_body', 'u8'],
        ['opened_wheel1', 'u8'],
        ['opened_wheel2', 'u8'],
        ['opened_weapon', 'u8'],
        ['opened_gadget', 'u8'],
      ],
    },
  ],
  [
    PartItem,
    {
      kind: 'struct',
      fields: [
        ['index_body', 'u8'],
        ['index_wheel1', 'u8'],
        ['index_wheel2', 'u8'],
        ['index_weapon', 'u8'],
        ['index_gadget', 'u8'],
      ],
    },
  ],
  [
    Total,
    {
      kind: 'struct',
      fields: [['total', 'u8']],
    },
  ],
  [
    PartTotal,
    {
      kind: 'struct',
      fields: [
        ['authority', 'pubkeyAsString'],
        ['total', 'u8']
      ],
    },
  ],
  [
    Config,
    {
      kind: 'struct',
      fields: [['index', 'u8']],
    },
  ],
  [
    TokenInfo,
    {
      kind: 'struct',
      fields: [
        ['token_address', 'pubkeyAsString'],
        ['bot_fee', 'u64'],
        ['gear_fee', 'u64'],
        ['box_type', 'u8']
      ],
    },
  ],
]);

export async function getTotal(
  connection: Connection,
  pageIndexer: PublicKey,
) {
  let configStore: any = await connection.getAccountInfo(
    pageIndexer,
  );
  configStore = [...configStore.data];
  const { total } = decodeTotal(configStore);
  return total;
}

export async function getPartsTotal(
  program: any,
  pageIndexer: PublicKey,
) {
  let configStore: any = await program.provider.connection.getAccountInfo(
    pageIndexer,
  );
  configStore = [...configStore.data];
  const total = decodePartTotal(configStore);
  return total;
}

export async function getStateProgram(
  program: any,
  pageIndexer: PublicKey,
) {
  try {
    let dataPage = await program.provider.connection.getAccountInfo(pageIndexer);
    dataPage = [...dataPage.data];
    const data = decodeIndex(dataPage);
    return data.index;
  } catch (e) {
    if (e.message.includes(" Service Unavailable")) {
     return await retryFunction({func:getStateProgram}, program, pageIndexer)
    } else {
      throw new Error(e.message)
    }
  }
}

export async function getOpenBoxProgramStatus(
  program: any,
  programStatus: PublicKey,
) {
  try {
    let dataPage = await program.provider.connection.getAccountInfo(programStatus);
    dataPage = [...dataPage.data];
    const data = decodeOpenBoxIndex(dataPage);
    return data.index;
  } catch (e) {
    if (e.message.includes(" Service Unavailable")) {
      return await retryFunction({func:getStateProgram}, program, programStatus)
    } else {
      throw new Error(e.message)
    }
  }
}

export async function getTokenInfo(
  program: any,
  tokenInfo: PublicKey,
) {
  try {
    let dataPage = await program.provider.connection.getAccountInfo(tokenInfo);
    dataPage = [...dataPage.data];
    const data = decodeOpenBoxTokenInfo(dataPage);
    return data;
  } catch (e) {
    if (e.message.includes(" Service Unavailable")) {
      return await retryFunction({func:getStateProgram}, program, tokenInfo)
    } else {
      throw new Error(e.message)
    }
  }
}

export const decodeItem = (data: Buffer, index: number) => {
  const pagestart =
    DISCRIMINATOR_LENGTH + OWNER_ADDRESS_LENGTH + OPTION_LENGTH + ENUM_LENGTH;
  const buffer = data.slice(
    pagestart + 4 + ITEM_LENGTH * index,
    pagestart + 4 + ITEM_LENGTH * (index + 1),
  );

  return deserializeUnchecked(SCHEMA, Item, Buffer.from(buffer)) as Item;
};

export const decodePartTypeItem = (data: Buffer, index: number) => {
  const pagestart =
    DISCRIMINATOR_LENGTH + OWNER_ADDRESS_LENGTH;
  const buffer = data.slice(
    pagestart + 4 + ITEM_PART_TYPE_LENGTH * index,
    pagestart + 4 + ITEM_PART_TYPE_LENGTH * (index + 1),
  );

  return deserializeUnchecked(SCHEMA, PartItem, Buffer.from(buffer)) as PartItem;
};

export const decodeTotal = (data: Buffer) => {
  const pagestart =
    DISCRIMINATOR_LENGTH + OWNER_ADDRESS_LENGTH + OPTION_LENGTH + ENUM_LENGTH;
  const buffer = data.slice(pagestart, pagestart + 4);

  return deserializeUnchecked(SCHEMA, Total, Buffer.from(buffer)) as Total;
};

export const decodePartTotal = (data: Buffer) => {
  const pagestart =
    DISCRIMINATOR_LENGTH;
  const buffer = data.slice(pagestart, pagestart + 4 + 32);

  return deserializeUnchecked(SCHEMA, PartTotal, Buffer.from(buffer)) as PartTotal;
};

export const decodeIndex = (data: Buffer) => {
  const pagestart = DISCRIMINATOR_LENGTH + OWNER_ADDRESS_LENGTH;
  const buffer = data.slice(
    pagestart + OPTION_LENGTH,
    pagestart + OPTION_LENGTH + ENUM_LENGTH,
  );

  return deserializeUnchecked(SCHEMA, Config, Buffer.from(buffer)) as Config;
};

export const decodeOpenBoxIndex = (data: Buffer) => {
  const pagestart = DISCRIMINATOR_LENGTH;
  const buffer = data.slice(
    pagestart,
    pagestart + ENUM_LENGTH,
  );

  return deserializeUnchecked(SCHEMA, Config, Buffer.from(buffer)) as Config;
};

export const decodeOpenBoxTokenInfo = (data: Buffer) => {
  const pagestart = DISCRIMINATOR_LENGTH;
  const buffer = data.slice(
    pagestart,
    pagestart + OWNER_ADDRESS_LENGTH+ U64_LENGTH + U64_LENGTH + U8_LENGTH,
  );

  return deserializeUnchecked(SCHEMA, TokenInfo, Buffer.from(buffer)) as TokenInfo;
};
