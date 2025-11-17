import hre from "hardhat";

const { ethers } = hre;

async function main() {
  console.log("Deploying DAO contracts...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy Token
  console.log("\n1. Deploying DAOToken...");
  const Token = await ethers.getContractFactory("DAOToken");
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
  const token = await Token.deploy("DAO Token", "DAO", initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("DAOToken deployed to:", tokenAddress);

  // Deploy Governor
  console.log("\n2. Deploying Governor...");
  const Governor = await ethers.getContractFactory("Governor");
  const governor = await Governor.deploy(tokenAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("Governor deployed to:", governorAddress);

  // Deploy Treasury (using deployer as temporary multisig)
  console.log("\n3. Deploying Treasury...");
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(governorAddress, deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury deployed to:", treasuryAddress);

  // Output deployment addresses
  console.log("\n=== Deployment Complete ===");
  console.log("DAOToken:", tokenAddress);
  console.log("Governor:", governorAddress);
  console.log("Treasury:", treasuryAddress);
  console.log("\nSave these addresses for your frontend configuration!");

  // Verify contracts on Etherscan (if not local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await token.deploymentTransaction().wait(5);
    await governor.deploymentTransaction().wait(5);
    await treasury.deploymentTransaction().wait(5);

    console.log("\nVerifying contracts on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: ["DAO Token", "DAO", initialSupply],
      });
      console.log("DAOToken verified!");
    } catch (e) {
      console.log("Error verifying DAOToken:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: governorAddress,
        constructorArguments: [tokenAddress],
      });
      console.log("Governor verified!");
    } catch (e) {
      console.log("Error verifying Governor:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: treasuryAddress,
        constructorArguments: [governorAddress, deployer.address],
      });
      console.log("Treasury verified!");
    } catch (e) {
      console.log("Error verifying Treasury:", e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
