import { Account, RawArgs, RpcProvider, UniversalDetails } from "starknet";

export type Networks = Record<"devnet" | "sepolia" | "mainnet", Network>;

export type Network = {
  provider: RpcProvider | null;
  deployer: Account | null;
  feeToken: { name: string; address: string }[];
};

export type DeployContractParams = {
  contract: string;
  contractName?: string;
  constructorArgs?: RawArgs;
  options?: UniversalDetails;
};

export type DeploymentInfo = {
  classHash: string;
  address: string;
  contract: string;
  abi: any[];
};

export type CombinedAbiInfo = {
  address: string;
  classHash: string;
  abi: any[];
};
