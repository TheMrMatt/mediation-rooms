// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "../lib/forge-std/src/Script.sol";
import {console} from "../lib/forge-std/src/console.sol";
import {MediationRegistry} from "../src/MediationRegistry.sol";
import {DemoEscrow} from "../src/DemoEscrow.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17bbad8b97c047d83019108eb9c93935c68d68f22bbee68b9fe)
        );

        vm.startBroadcast(deployerPrivateKey);
        MediationRegistry registry = new MediationRegistry();
        DemoEscrow escrow = new DemoEscrow(address(registry));
        FreelanceEscrow freelanceEscrow = new FreelanceEscrow(address(registry));
        vm.stopBroadcast();

        console.log("chainId:", block.chainid);
        console.log("MediationRegistry:", address(registry));
        console.log("DemoEscrow:", address(escrow));
        console.log("FreelanceEscrow:", address(freelanceEscrow));

        string memory root = vm.projectRoot();
        string memory filePath = string.concat(
            root,
            "/deployments/",
            vm.toString(block.chainid),
            ".json"
        );

        string memory json = "deployment";
        vm.serializeAddress(json, "mediationRegistry", address(registry));
        vm.serializeAddress(json, "demoEscrow", address(escrow));
        string memory out = vm.serializeAddress(
            json,
            "freelanceEscrow",
            address(freelanceEscrow)
        );
        vm.writeJson(out, filePath);
    }
}
