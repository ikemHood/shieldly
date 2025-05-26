import fs from "fs";
import path from "path";
import { networks } from "./helpers/networks";
import yargs from "yargs";
import {
  CallData,
  stark,
  RawArgs,
  transaction,
  extractContractHashes,
  DeclareContractPayload,
  UniversalDetails,
  constants,
  Call,
} from "starknet";
import { DeployContractParams, Network, DeploymentInfo, CombinedAbiInfo } from "./types";
import { green, red, yellow } from "./helpers/colorize-log";

interface Arguments {
  network: string;
  reset: boolean;
  [x: string]: unknown;
  _: (string | number)[];
  $0: string;
}

const argv = yargs(process.argv.slice(2))
  .option("network", {
    type: "string",
    description: "Specify the network",
    demandOption: true,
  })
  .option("reset", {
    type: "boolean",
    description: "Reset deployments (remove existing deployments)",
    default: true,
  })
  .parseSync() as Arguments;

const networkName: string = argv.network;
const resetDeployments: boolean = argv.reset;

// Validate network is supported
const validNetworks = ["devnet", "sepolia", "mainnet"];
if (!validNetworks.includes(networkName)) {
  console.error(red(`Unsupported network: ${networkName}. Supported networks: ${validNetworks.join(", ")}`));
  process.exit(1);
}

// Validate network configuration exists
const networkConfig = networks[networkName as keyof typeof networks];
if (!networkConfig) {
  console.error(red(`Network configuration not found for: ${networkName}`));
  process.exit(1);
}

if (!networkConfig.provider) {
  console.error(red(`RPC URL not configured for ${networkName}. Please set RPC_URL_${networkName.toUpperCase()} in your .env file`));
  process.exit(1);
}

if (!networkConfig.deployer) {
  console.error(red(`Deployer account not configured for ${networkName}. Please set ACCOUNT_ADDRESS_${networkName.toUpperCase()} and PRIVATE_KEY_${networkName.toUpperCase()} in your .env file`));
  process.exit(1);
}

let deployments: Record<string, DeploymentInfo> = {};
let deployCalls: Call[] = [];

const { provider, deployer } = networkConfig;

// After validation, we know these are not null, so we can assert the types
const validatedProvider = provider!;
const validatedDeployer = deployer!;

const declareIfNot_NotWait = async (
  payload: DeclareContractPayload,
  options?: UniversalDetails
) => {
  const declareContractPayload = extractContractHashes(payload);
  try {
    await validatedProvider.getClassByHash(declareContractPayload.classHash);
  } catch (error) {
    try {
      const { transaction_hash } = await validatedDeployer.declare(payload, {
        ...options,
        version: constants.TRANSACTION_VERSION.V3,
      });
      if (networkName === "sepolia" || networkName === "mainnet") {
        console.log(
          yellow("Waiting for declaration transaction to be accepted...")
        );
        const receipt = await validatedProvider.waitForTransaction(transaction_hash);
        console.log(
          yellow("Declaration transaction receipt:"),
          JSON.stringify(
            receipt,
            (_, v) => (typeof v === "bigint" ? v.toString() : v),
            2
          )
        );

        const receiptAny = receipt as any;
        if (receiptAny.execution_status !== "SUCCEEDED") {
          const revertReason = receiptAny.revert_reason || "Unknown reason";
          throw new Error(
            red(`Declaration failed or reverted. Reason: ${revertReason}`)
          );
        }
        console.log(green("Declaration successful"));
      }
    } catch (e) {
      console.error(red("Error declaring contract:"), e);
      throw e;
    }
  }
  return {
    classHash: declareContractPayload.classHash,
  };
};

const deployContract_NotWait = async (payload: {
  salt: string;
  classHash: string;
  constructorCalldata: RawArgs;
}) => {
  try {
    const { calls, addresses } = transaction.buildUDCCall(
      payload,
      validatedDeployer.address
    );
    deployCalls.push(...calls);
    return {
      contractAddress: addresses[0],
    };
  } catch (error) {
    console.error(red("Error building UDC call:"), error);
    throw error;
  }
};

const findContractFile = (
  contract: string,
  fileType: "compiled_contract_class" | "contract_class"
): string => {
  const targetDir = path.resolve(__dirname, "../target/dev");

  if (!fs.existsSync(targetDir)) {
    throw new Error(
      `Target directory not found: ${targetDir}. Please run 'scarb build' first.`
    );
  }

  const files = fs.readdirSync(targetDir);

  const pattern = new RegExp(`.*${contract}\\.${fileType}\\.json$`);
  const matchingFile = files.find((file: string) => pattern.test(file));

  if (!matchingFile) {
    throw new Error(
      `Could not find ${fileType} file for contract "${contract}". ` +
      `Try removing packages/contracts/target, then run 'scarb build' and check if your contract name is correct inside the packages/contracts/target/dev directory.`
    );
  }

  return path.join(targetDir, matchingFile);
};

const deployContract = async (
  params: DeployContractParams
): Promise<{
  classHash: string;
  address: string;
}> => {
  const { contract, constructorArgs, contractName, options } = params;

  try {
    await validatedDeployer.getContractVersion(validatedDeployer.address);
  } catch (e: any) {
    if (e.toString().includes("Contract not found")) {
      const errorMessage = `The wallet you're using to deploy the contract is not deployed in the ${networkName} network.`;
      console.error(red(errorMessage));
      throw new Error(errorMessage);
    } else {
      console.error(red("Error getting contract version: "), e);
      throw e;
    }
  }

  let compiledContractCasm: any;
  let compiledContractSierra: any;

  try {
    compiledContractCasm = JSON.parse(
      fs
        .readFileSync(findContractFile(contract, "compiled_contract_class"))
        .toString("ascii")
    );
  } catch (error: any) {
    if (error.message && error.message.includes("Could not find")) {
      console.error(
        red(`The contract "${contract}" doesn't exist or is not compiled`)
      );
    } else {
      console.error(red("Error reading compiled contract class file: "), error);
    }
    return {
      classHash: "",
      address: "",
    };
  }

  try {
    compiledContractSierra = JSON.parse(
      fs
        .readFileSync(findContractFile(contract, "contract_class"))
        .toString("ascii")
    );
  } catch (error: any) {
    console.error(red("Error reading contract class file: "), error);
    return {
      classHash: "",
      address: "",
    };
  }

  const contractCalldata = new CallData(compiledContractSierra.abi);
  const constructorCalldata = constructorArgs
    ? contractCalldata.compile("constructor", constructorArgs)
    : [];

  console.log(yellow("Deploying Contract "), contractName || contract);

  let { classHash } = await declareIfNot_NotWait(
    {
      contract: compiledContractSierra,
      casm: compiledContractCasm,
    },
    options
  );

  let randomSalt = stark.randomAddress();

  let { contractAddress } = await deployContract_NotWait({
    salt: randomSalt,
    classHash,
    constructorCalldata,
  });

  console.log(green("Contract Deployed at "), contractAddress);

  let finalContractName = contractName || contract;

  deployments[finalContractName] = {
    classHash: classHash,
    address: contractAddress,
    contract: contract,
    abi: compiledContractSierra.abi,
  };

  return {
    classHash: classHash,
    address: contractAddress,
  };
};

const executeDeployCalls = async (options?: UniversalDetails) => {
  if (deployCalls.length < 1) {
    throw new Error(
      red(
        "Aborted: No contract to deploy. Please prepare the contracts with `deployContract`"
      )
    );
  }

  try {
    let { transaction_hash } = await validatedDeployer.execute(deployCalls, {
      ...options,
      version: constants.TRANSACTION_VERSION.V3,
    });
    if (networkName === "sepolia" || networkName === "mainnet") {
      const receipt = await validatedProvider.waitForTransaction(transaction_hash);
      const receiptAny = receipt as any;
      if (receiptAny.execution_status !== "SUCCEEDED") {
        const revertReason = receiptAny.revert_reason;
        throw new Error(red(`Deploy Calls Failed: ${revertReason}`));
      }
    }
    console.log(green("Deploy Calls Executed at "), transaction_hash);
  } catch (error) {
    // split the calls in half and try again recursively
    if (deployCalls.length > 100) {
      let half = Math.ceil(deployCalls.length / 2);
      let firstHalf = deployCalls.slice(0, half);
      let secondHalf = deployCalls.slice(half);
      deployCalls = firstHalf;
      await executeDeployCalls(options);
      deployCalls = secondHalf;
      await executeDeployCalls(options);
    } else {
      throw error;
    }
  }
};

const loadExistingDeployments = () => {
  const networkPath = path.resolve(
    __dirname,
    `../deployments/${networkName}_latest.json`
  );
  if (fs.existsSync(networkPath)) {
    return JSON.parse(fs.readFileSync(networkPath, "utf8"));
  }
  return {};
};

const exportDeployments = () => {
  const networkPath = path.resolve(
    __dirname,
    `../deployments/${networkName}_latest.json`
  );

  if (!resetDeployments && fs.existsSync(networkPath)) {
    const currentTimestamp = new Date().getTime();
    fs.renameSync(
      networkPath,
      networkPath.replace("_latest.json", `_${currentTimestamp}.json`)
    );
  }

  if (resetDeployments && fs.existsSync(networkPath)) {
    fs.unlinkSync(networkPath);
  }

  // Ensure deployments directory exists
  const deploymentsDir = path.dirname(networkPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Export main deployments file with all information including ABIs
  fs.writeFileSync(networkPath, JSON.stringify(deployments, null, 2));
  console.log(green(`Deployments exported to: ${networkPath}`));

  // Export separate ABI files for each contract for easier frontend integration
  const abiDir = path.resolve(__dirname, `../deployments/abis`);
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  Object.entries(deployments).forEach(([contractName, deployment]: [string, DeploymentInfo]) => {
    if (deployment.abi) {
      const abiPath = path.resolve(abiDir, `${contractName}_${networkName}.json`);
      fs.writeFileSync(abiPath, JSON.stringify(deployment.abi, null, 2));
      console.log(green(`ABI exported to: ${abiPath}`));
    }
  });

  // Export a combined ABI file for all contracts
  const combinedAbiPath = path.resolve(abiDir, `all_contracts_${networkName}.json`);
  const combinedAbis: Record<string, CombinedAbiInfo> = {};
  Object.entries(deployments).forEach(([contractName, deployment]: [string, DeploymentInfo]) => {
    if (deployment.abi) {
      combinedAbis[contractName] = {
        address: deployment.address,
        classHash: deployment.classHash,
        abi: deployment.abi
      };
    }
  });
  fs.writeFileSync(combinedAbiPath, JSON.stringify(combinedAbis, null, 2));
  console.log(green(`Combined ABIs exported to: ${combinedAbiPath}`));
};

export {
  deployContract,
  validatedProvider,
  validatedDeployer,
  loadExistingDeployments,
  exportDeployments,
  executeDeployCalls,
  resetDeployments,
};
