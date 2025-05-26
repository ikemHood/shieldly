import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import yargs from "yargs";
import { green, red, yellow } from "./helpers/colorize-log";

function main() {
  // Parse command line arguments
  const argv = yargs(process.argv.slice(2))
    .option("network", {
      type: "string",
      description: "Specify the network mainnet or sepolia",
      demandOption: true,
    })
    .parseSync();

  const network = argv.network;

  if (network !== "sepolia" && network !== "mainnet") {
    console.error(
      `Unsupported network: ${network}. Please use 'sepolia' or 'mainnet'.`
    );
    process.exit(1);
  }

  // Read deployments from the deployments directory
  const deploymentsPath = path.resolve(__dirname, `../deployments/${network}_latest.json`);

  if (!fs.existsSync(deploymentsPath)) {
    console.error(`No deployments found for network: ${network}. Run deployment first.`);
    process.exit(1);
  }

  const deployedContracts = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

  if (!deployedContracts || Object.keys(deployedContracts).length === 0) {
    console.error(`No deployed contracts found for network: ${network}`);
    process.exit(1);
  }

  // Change to the contracts directory root (where Scarb.toml is located)
  const contractsDir = path.resolve(__dirname, "..");
  process.chdir(contractsDir);

  // Verify each contract
  Object.entries(deployedContracts).forEach(
    ([contractName, contractInfo]: [string, any]) => {
      const { address, contract } = contractInfo;

      if (!address || !contract) {
        console.error(red(`Missing address or contract name for ${contractName}`));
        return;
      }

      console.log(yellow(`Verifying ${contractName} on ${network}...`));
      try {
        execSync(
          `sncast verify --contract-address ${address} --contract-name ${contract} --network ${network} --verifier walnut --confirm-verification`,
          { stdio: "inherit" }
        );
        console.log(green("Successfully verified"), contractName);
      } catch (error) {
        console.error(red(`Failed to verify ${contractName}:`), error);
      }
    }
  );
  console.log(green("✅ Verification process completed."));
}

if (typeof module !== "undefined" && require.main === module) {
  main();
}
