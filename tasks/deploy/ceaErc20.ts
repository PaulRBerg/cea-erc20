import * as core from "@actions/core";
import { TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { task, types } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

import { CeaErc20__factory } from "../../src/types/factories/CeaErc20__factory";

// See https://github.com/Zoltu/deterministic-deployment-proxy
export const DETERMINISTIC_DEPLOYMENT_PROXY_ADDRESS: string = "0x7A0D94F55792C434d74a40883C6ed8545E406D12";

task("deploy:contract:cea-erc20")
  .addOptionalParam("confirmations", "How many block confirmations to wait for", 2, types.int)
  .addOptionalParam("printAddress", "Print the address in the console", true, types.boolean)
  .addOptionalParam("setOutput", "Set the contract address as an output in GitHub Actions", false, types.boolean)
  .addOptionalParam("verifyEtherscan", "Whether the contract should be verified on Etherscan", false, types.boolean)
  .setAction(async function (taskArgs: TaskArguments, { ethers, run }): Promise<string> {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    const deployer: SignerWithAddress = signers[0];

    const ceaErc20Factory: CeaErc20__factory = new CeaErc20__factory(deployer);
    const deploymentTx: TransactionRequest = ceaErc20Factory.getDeployTransaction();
    deploymentTx.to = DETERMINISTIC_DEPLOYMENT_PROXY_ADDRESS;
    const ceaErc20Address: string = await deployer.call(deploymentTx);
    const txResponse: TransactionResponse = await deployer.sendTransaction(deploymentTx);
    await txResponse.wait(taskArgs.confirmations);

    if (taskArgs.setOutput) {
      core.setOutput("cea-erc20", ceaErc20Address);
    }
    if (taskArgs.printAddress) {
      console.table([{ name: "CeaErc20", address: ceaErc20Address }]);
    }
    if (taskArgs.verifyEtherscan) {
      await run("verify:verify", {
        address: ceaErc20Address,
        constructorArguments: [],
      });
    }
    return ceaErc20Address;
  });
