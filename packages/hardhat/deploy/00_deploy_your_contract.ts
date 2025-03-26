import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployBuyMeACoffee: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy the BuyMeACoffee contract without constructor arguments
  const buyMeACoffeeDeployment = await deploy("BuyMeACoffee", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("BuyMeACoffee deployed to:", buyMeACoffeeDeployment.address);
};

export default deployBuyMeACoffee;
deployBuyMeACoffee.tags = ["BuyMeACoffee"];
