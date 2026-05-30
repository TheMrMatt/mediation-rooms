// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IMediationRegistry} from "./IMediationRegistry.sol";

/**
 * @title MediationRegistry
 * @notice On-chain registry for mediation cases. Tracks status and resolution
 *         so external contracts can query whether a critical action may execute.
 */
contract MediationRegistry is IMediationRegistry {
    address public owner;
    mapping(bytes32 => CaseRecord) private _cases;

    modifier onlyOwner() {
        require(msg.sender == owner, "MediationRegistry: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function openCase(
        bytes32 caseId,
        address claimant,
        address respondent,
        ExternalAction calldata externalAction,
        uint256 expiresAt
    ) external override {
        require(caseId != bytes32(0), "MediationRegistry: invalid caseId");
        require(claimant != address(0), "MediationRegistry: invalid claimant");
        require(respondent != address(0), "MediationRegistry: invalid respondent");
        require(_cases[caseId].createdAt == 0, "MediationRegistry: case exists");
        require(expiresAt > block.timestamp, "MediationRegistry: invalid expiry");

        _cases[caseId] = CaseRecord({
            caseId: caseId,
            claimant: claimant,
            respondent: respondent,
            status: CaseStatus.OPEN,
            resolution: Resolution.PENDING,
            externalAction: externalAction,
            createdAt: block.timestamp,
            disputedAt: 0,
            resolvedAt: 0,
            expiresAt: expiresAt
        });

        emit CaseOpened(caseId, claimant, respondent, externalAction.contractAddress, externalAction.actionId);
    }

    function markDisputed(bytes32 caseId) external override {
        CaseRecord storage record = _cases[caseId];
        require(record.createdAt != 0, "MediationRegistry: case not found");
        require(record.status == CaseStatus.OPEN, "MediationRegistry: not open");
        // El contrato externo que abrió el caso media el control de partes; también
        // se permite que las partes lo marquen directamente.
        require(
            msg.sender == record.externalAction.contractAddress
                || msg.sender == record.claimant
                || msg.sender == record.respondent,
            "MediationRegistry: not authorized"
        );

        record.status = CaseStatus.DISPUTED;
        record.disputedAt = block.timestamp;

        emit CaseDisputed(caseId, msg.sender, block.timestamp);
    }

    function resolveCase(bytes32 caseId, Resolution resolution) external override onlyOwner {
        CaseRecord storage record = _cases[caseId];
        require(record.createdAt != 0, "MediationRegistry: case not found");
        require(
            record.status == CaseStatus.OPEN || record.status == CaseStatus.DISPUTED,
            "MediationRegistry: not resolvable"
        );
        require(resolution != Resolution.PENDING, "MediationRegistry: invalid resolution");

        record.status = CaseStatus.RESOLVED;
        record.resolution = resolution;
        record.resolvedAt = block.timestamp;

        emit CaseResolved(caseId, resolution, block.timestamp);
    }

    function canExecute(bytes32 caseId) external view override returns (bool) {
        CaseRecord storage record = _cases[caseId];
        if (record.createdAt == 0) return false;

        if (record.status == CaseStatus.RESOLVED) {
            return record.resolution == Resolution.RELEASE_TO_PROVIDER
                || record.resolution == Resolution.SPLIT_PAYMENT;
        }

        if (record.status == CaseStatus.OPEN && block.timestamp >= record.expiresAt) {
            return true;
        }

        if (record.status == CaseStatus.EXPIRED_NO_DISPUTE) {
            return true;
        }

        return false;
    }

    function getResolution(bytes32 caseId) external view override returns (Resolution) {
        return _cases[caseId].resolution;
    }

    function getCase(bytes32 caseId) external view override returns (CaseRecord memory) {
        require(_cases[caseId].createdAt != 0, "MediationRegistry: case not found");
        return _cases[caseId];
    }

    /** @notice Marks expired open cases as EXPIRED_NO_DISPUTE (callable by anyone). */
    function expireCase(bytes32 caseId) external {
        CaseRecord storage record = _cases[caseId];
        require(record.createdAt != 0, "MediationRegistry: case not found");
        require(record.status == CaseStatus.OPEN, "MediationRegistry: not open");
        require(block.timestamp >= record.expiresAt, "MediationRegistry: not expired");

        record.status = CaseStatus.EXPIRED_NO_DISPUTE;
        record.resolution = Resolution.RELEASE_TO_PROVIDER;
        record.resolvedAt = block.timestamp;

        emit CaseResolved(caseId, Resolution.RELEASE_TO_PROVIDER, block.timestamp);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MediationRegistry: invalid owner");
        owner = newOwner;
    }
}
