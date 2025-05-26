import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  validatedDeployer as deployer,
} from "./deploy-contract";
import { getOracleAddress } from "./helpers/networks";
import { green } from "./helpers/colorize-log";
import yargs from "yargs";

const argv = yargs(process.argv.slice(2))
  .option("network", {
    type: "string",
    description: "Specify the network",
    demandOption: true,
  })
  .parseSync();

const networkName = argv.network as "devnet" | "sepolia" | "mainnet";

const deployScript = async (): Promise<void> => {
  // ShieldlyCore requires owner and pragma_oracle_address constructor arguments
  const oracleAddress = getOracleAddress(networkName);

  console.log(`Deploying ShieldlyCore on ${networkName} network`);
  console.log(`Using oracle address: ${oracleAddress}`);

  await deployContract({
    contract: "shieldly_ShieldlyCore",
    contractName: "ShieldlyCore",
    constructorArgs: {
      owner: deployer.address,
      pragma_oracle_address: oracleAddress,
    },
  });
};

const main = async (): Promise<void> => {
  try {
    await deployScript();
    await executeDeployCalls();
    exportDeployments();

    console.log(green("All Setup Done!"));
  } catch (err) {
    console.log(err);
    process.exit(1); //exit with error so that non subsequent scripts are run
  }
};

main();
