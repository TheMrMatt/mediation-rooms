// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MediationRegistry} from "../src/MediationRegistry.sol";
import {FreelanceEscrow} from "../src/FreelanceEscrow.sol";
import {IMediationRegistry} from "../src/IMediationRegistry.sol";

contract FreelanceEscrowTest is Test {
    MediationRegistry registry;
    FreelanceEscrow escrow;

    address client = address(0xC1);
    address freelancer = address(0xF1);

    bytes32 dealId = keccak256("deal-1");
    bytes32 caseId = keccak256("case-1");
    string rules = "Entregar landing funcional|Deploy accesible|Repo documentado";

    function setUp() public {
        registry = new MediationRegistry();
        escrow = new FreelanceEscrow(address(registry));
        vm.deal(client, 10 ether);
    }

    function _fundAndDeliver() internal {
        vm.prank(client);
        escrow.createAndFund{value: 1 ether}(dealId, freelancer, rules);

        vm.prank(freelancer);
        escrow.deliverWork(dealId, caseId, "ipfs://entrega");
    }

    function test_createAndFund() public {
        vm.prank(client);
        escrow.createAndFund{value: 1 ether}(dealId, freelancer, rules);

        FreelanceEscrow.Deal memory deal = escrow.getDeal(dealId);
        assertEq(deal.client, client);
        assertEq(deal.freelancer, freelancer);
        assertEq(deal.amount, 1 ether);
        assertEq(uint256(deal.status), uint256(FreelanceEscrow.Status.FUNDED));
        assertEq(deal.rules, rules);
    }

    function test_deliverOpensCase() public {
        _fundAndDeliver();

        IMediationRegistry.CaseRecord memory record = registry.getCase(caseId);
        assertEq(uint256(record.status), uint256(IMediationRegistry.CaseStatus.OPEN));
        assertEq(record.claimant, client);
        assertEq(record.respondent, freelancer);
    }

    function test_acceptReleasesImmediately() public {
        _fundAndDeliver();

        uint256 before = freelancer.balance;
        vm.prank(client);
        escrow.accept(dealId);

        assertEq(freelancer.balance, before + 1 ether);
        assertEq(uint256(escrow.getDeal(dealId).status), uint256(FreelanceEscrow.Status.RELEASED));
    }

    function test_autoReleaseAfter48h() public {
        _fundAndDeliver();

        vm.warp(block.timestamp + 48 hours + 1);
        registry.expireCase(caseId);

        uint256 before = freelancer.balance;
        escrow.release(dealId);
        assertEq(freelancer.balance, before + 1 ether);
    }

    function test_onlyFreelancerDelivers() public {
        vm.prank(client);
        escrow.createAndFund{value: 1 ether}(dealId, freelancer, rules);

        vm.prank(client);
        vm.expectRevert(FreelanceEscrow.NotFreelancer.selector);
        escrow.deliverWork(dealId, caseId, "ipfs://x");
    }

    function test_disputeByClientThenRefund() public {
        _fundAndDeliver();

        vm.prank(client);
        escrow.openDispute(dealId, "No cumple las reglas acordadas");

        IMediationRegistry.CaseRecord memory record = registry.getCase(caseId);
        assertEq(uint256(record.status), uint256(IMediationRegistry.CaseStatus.DISPUTED));

        // El backend (owner del registry) resuelve tras el fallo del agente.
        registry.resolveCase(caseId, IMediationRegistry.Resolution.REFUND_TO_CLIENT);

        uint256 before = client.balance;
        escrow.refund(dealId);
        assertEq(client.balance, before + 1 ether);
    }

    function test_disputeThenReleaseToFreelancer() public {
        _fundAndDeliver();

        vm.prank(freelancer);
        escrow.openDispute(dealId, "El cliente bloquea el pago sin motivo");

        registry.resolveCase(caseId, IMediationRegistry.Resolution.RELEASE_TO_PROVIDER);

        uint256 before = freelancer.balance;
        escrow.release(dealId);
        assertEq(freelancer.balance, before + 1 ether);
    }

    function test_splitPayment() public {
        _fundAndDeliver();

        vm.prank(client);
        escrow.openDispute(dealId, "Entrega parcial");

        registry.resolveCase(caseId, IMediationRegistry.Resolution.SPLIT_PAYMENT);

        uint256 cBefore = client.balance;
        uint256 fBefore = freelancer.balance;
        escrow.settleSplit(dealId);

        assertEq(freelancer.balance, fBefore + 0.5 ether);
        assertEq(client.balance, cBefore + 0.5 ether);
    }

    function test_releaseBlockedWhenRefundResolution() public {
        _fundAndDeliver();

        vm.prank(client);
        escrow.openDispute(dealId, "No sirve");

        registry.resolveCase(caseId, IMediationRegistry.Resolution.REFUND_TO_CLIENT);

        vm.expectRevert();
        escrow.release(dealId);
    }

    function test_cannotReleaseBeforeWindow() public {
        _fundAndDeliver();

        vm.expectRevert();
        escrow.release(dealId);
    }
}
