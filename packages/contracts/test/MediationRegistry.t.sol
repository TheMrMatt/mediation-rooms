// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MediationRegistry} from "../src/MediationRegistry.sol";
import {DemoEscrow} from "../src/DemoEscrow.sol";
import {IMediationRegistry} from "../src/IMediationRegistry.sol";

contract MediationRegistryTest is Test {
    MediationRegistry registry;
    DemoEscrow escrow;

    address client = address(0x1);
    address provider = address(0x2);

    bytes32 escrowId = keccak256("escrow-1");
    bytes32 caseId = keccak256("case-1");

    function setUp() public {
        registry = new MediationRegistry();
        escrow = new DemoEscrow(address(registry));
        vm.deal(client, 10 ether);
    }

    function test_depositAndMarkDelivery() public {
        vm.prank(client);
        escrow.deposit{value: 1 ether}(escrowId, provider);

        vm.prank(provider);
        escrow.markDelivery(escrowId, caseId);

        IMediationRegistry.CaseRecord memory record = registry.getCase(caseId);
        assertEq(uint256(record.status), uint256(IMediationRegistry.CaseStatus.OPEN));
    }

    function test_releaseAfterExpiry() public {
        vm.prank(client);
        escrow.deposit{value: 1 ether}(escrowId, provider);

        vm.prank(provider);
        escrow.markDelivery(escrowId, caseId);

        vm.warp(block.timestamp + 4 days);
        registry.expireCase(caseId);

        uint256 providerBalanceBefore = provider.balance;
        escrow.release(escrowId);
        assertEq(provider.balance, providerBalanceBefore + 1 ether);
    }

    function test_refundOnResolution() public {
        vm.prank(client);
        escrow.deposit{value: 1 ether}(escrowId, provider);

        vm.prank(provider);
        escrow.markDelivery(escrowId, caseId);

        vm.prank(client);
        escrow.openDispute(escrowId);

        registry.resolveCase(caseId, IMediationRegistry.Resolution.REFUND_TO_CLIENT);

        uint256 clientBalanceBefore = client.balance;
        escrow.refund(escrowId);
        assertEq(client.balance, clientBalanceBefore + 1 ether);
    }
}
