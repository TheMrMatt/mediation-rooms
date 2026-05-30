// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MediationGuard} from "./MediationGuard.sol";
import {IMediationRegistry} from "./IMediationRegistry.sol";

/**
 * @title DemoEscrow
 * @notice Demo use case: client deposits funds, provider marks delivery,
 *         mediation window opens, and funds are released or refunded based on resolution.
 *
 * Flow:
 *   1. Client deposits ETH
 *   2. Provider marks delivery → mediation case opens
 *   3. If no dispute within window OR resolution favors provider → release to provider
 *   4. If resolution favors client → refund to client
 */
contract DemoEscrow is MediationGuard {
    enum EscrowStatus {
        NONE,
        DEPOSITED,
        DELIVERY_MARKED,
        RELEASED,
        REFUNDED
    }

    struct Escrow {
        bytes32 caseId;
        address client;
        address provider;
        uint256 amount;
        EscrowStatus status;
        uint256 depositedAt;
    }

    uint256 public constant MEDIATION_WINDOW = 3 days;

    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => bytes32) public caseToEscrow;

    event Deposited(bytes32 indexed escrowId, address indexed client, uint256 amount);
    event DeliveryMarked(bytes32 indexed escrowId, bytes32 indexed caseId);
    event Released(bytes32 indexed escrowId, address indexed provider, uint256 amount);
    event Refunded(bytes32 indexed escrowId, address indexed client, uint256 amount);

    constructor(address registry) MediationGuard(registry) {}

    function deposit(bytes32 escrowId, address provider) external payable {
        require(msg.value > 0, "DemoEscrow: zero deposit");
        require(provider != address(0), "DemoEscrow: invalid provider");
        require(escrows[escrowId].status == EscrowStatus.NONE, "DemoEscrow: exists");

        escrows[escrowId] = Escrow({
            caseId: bytes32(0),
            client: msg.sender,
            provider: provider,
            amount: msg.value,
            status: EscrowStatus.DEPOSITED,
            depositedAt: block.timestamp
        });

        emit Deposited(escrowId, msg.sender, msg.value);
    }

    function markDelivery(bytes32 escrowId, bytes32 caseId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.DEPOSITED, "DemoEscrow: not deposited");
        require(msg.sender == escrow.provider, "DemoEscrow: not provider");
        require(caseId != bytes32(0), "DemoEscrow: invalid caseId");

        escrow.status = EscrowStatus.DELIVERY_MARKED;
        escrow.caseId = caseId;
        caseToEscrow[caseId] = escrowId;

        IMediationRegistry.ExternalAction memory action = IMediationRegistry.ExternalAction({
            contractAddress: address(this),
            actionId: keccak256(abi.encodePacked("RELEASE", escrowId))
        });

        mediationRegistry.openCase(
            caseId,
            escrow.client,
            escrow.provider,
            action,
            block.timestamp + MEDIATION_WINDOW
        );

        emit DeliveryMarked(escrowId, caseId);
    }

    function release(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.DELIVERY_MARKED, "DemoEscrow: not ready");
        require(escrow.caseId != bytes32(0), "DemoEscrow: no case");

        _requireMediationAllows(escrow.caseId);

        IMediationRegistry.Resolution resolution = _getResolution(escrow.caseId);

        if (resolution == IMediationRegistry.Resolution.REFUND_TO_CLIENT) {
            revert ActionBlocked(escrow.caseId, resolution);
        }

        escrow.status = EscrowStatus.RELEASED;
        uint256 amount = escrow.amount;
        escrow.amount = 0;

        (bool success,) = escrow.provider.call{value: amount}("");
        require(success, "DemoEscrow: transfer failed");

        emit Released(escrowId, escrow.provider, amount);
    }

    function refund(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.DELIVERY_MARKED, "DemoEscrow: not ready");
        require(escrow.caseId != bytes32(0), "DemoEscrow: no case");

        IMediationRegistry.Resolution resolution = _getResolution(escrow.caseId);
        require(
            resolution == IMediationRegistry.Resolution.REFUND_TO_CLIENT,
            "DemoEscrow: resolution does not allow refund"
        );

        escrow.status = EscrowStatus.REFUNDED;
        uint256 amount = escrow.amount;
        escrow.amount = 0;

        (bool success,) = escrow.client.call{value: amount}("");
        require(success, "DemoEscrow: transfer failed");

        emit Refunded(escrowId, escrow.client, amount);
    }

    function openDispute(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.caseId != bytes32(0), "DemoEscrow: no case");
        require(
            msg.sender == escrow.client || msg.sender == escrow.provider,
            "DemoEscrow: not a party"
        );

        mediationRegistry.markDisputed(escrow.caseId);
    }

    function getEscrow(bytes32 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }
}
