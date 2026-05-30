// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IMediationRegistry
 * @notice Interface for the on-chain mediation case registry.
 */
interface IMediationRegistry {
    enum CaseStatus {
        OPEN,
        DISPUTED,
        RESOLVED,
        EXPIRED_NO_DISPUTE,
        CANCELLED
    }

    enum Resolution {
        PENDING,
        RELEASE_TO_PROVIDER,
        REFUND_TO_CLIENT,
        SPLIT_PAYMENT,
        REQUEST_MORE_EVIDENCE,
        MANUAL_REVIEW,
        CANCEL_ACTION
    }

    struct ExternalAction {
        address contractAddress;
        bytes32 actionId;
    }

    struct CaseRecord {
        bytes32 caseId;
        address claimant;
        address respondent;
        CaseStatus status;
        Resolution resolution;
        ExternalAction externalAction;
        uint256 createdAt;
        uint256 disputedAt;
        uint256 resolvedAt;
        uint256 expiresAt;
    }

    event CaseOpened(
        bytes32 indexed caseId,
        address indexed claimant,
        address indexed respondent,
        address contractAddress,
        bytes32 actionId
    );

    event CaseDisputed(bytes32 indexed caseId, address indexed disputedBy, uint256 timestamp);

    event CaseResolved(bytes32 indexed caseId, Resolution resolution, uint256 timestamp);

    function openCase(
        bytes32 caseId,
        address claimant,
        address respondent,
        ExternalAction calldata externalAction,
        uint256 expiresAt
    ) external;

    function markDisputed(bytes32 caseId) external;

    function resolveCase(bytes32 caseId, Resolution resolution) external;

    function canExecute(bytes32 caseId) external view returns (bool);

    function getResolution(bytes32 caseId) external view returns (Resolution);

    function getCase(bytes32 caseId) external view returns (CaseRecord memory);
}
