import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../helper-functions"
import { networkConfig, developmentChains, RECIPIENT_WALLET } from "../helper-hardhat-config"
import { ethers } from "hardhat"

const deployTreasury: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  log("----------------------------------------------------")
  log("Deploying Treasury and waiting for confirmations...")
  const amount = ethers.utils.parseUnits("2", "ether")
  const treasury = await deploy("Treasury", {
    from: deployer,
    args: [RECIPIENT_WALLET],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    value: amount,
  })
  log(`Treasury at ${treasury.address}`)
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(treasury.address, [])
  }
  const treasuryContract = await ethers.getContractAt("Treasury", treasury.address)
  const timeLock = await ethers.getContract("TimeLock")
  const transferTx = await treasuryContract.transferOwnership(timeLock.address)
  await transferTx.wait(1)
}

export default deployTreasury
deployTreasury.tags = ["all", "treasury"]
