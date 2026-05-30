// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IMediationRegistry} from "./IMediationRegistry.sol";

/**
 * @title MediationGuard
 * @notice Abstract contract that external contracts can inherit to gate
 *         critical actions behind mediation resolution.
 */
abstract contract MediationGuard {
    IMediationRegistry public immutable mediationRegistry;

    error MediationNotResolved(bytes32 caseId);
    error ActionBlocked(bytes32 caseId, IMediationRegistry.Resolution resolution);

    constructor(address registry) {
        require(registry != address(0), "MediationGuard: invalid registry");
        mediationRegistry = IMediationRegistry(registry);
    }

    /**
     * @dev Modifier that blocks execution until mediation allows it.
     *      Override `_onMediationAllowed` to implement action-specific logic.
     */
    modifier onlyWhenMediationAllows(bytes32 caseId) {
        _requireMediationAllows(caseId);
        _;
    }

    function _requireMediationAllows(bytes32 caseId) internal view {
        IMediationRegistry.CaseRecord memory record = mediationRegistry.getCase(caseId);

        if (
            record.status != IMediationRegistry.CaseStatus.RESOLVED
                && record.status != IMediationRegistry.CaseStatus.EXPIRED_NO_DISPUTE
        ) {
            if (record.status == IMediationRegistry.CaseStatus.OPEN && block.timestamp >= record.expiresAt) {
                return;
            }
            revert MediationNotResolved(caseId);
        }

        if (!mediationRegistry.canExecute(caseId)) {
            revert ActionBlocked(caseId, mediationRegistry.getResolution(caseId));
        }
    }

    function _getResolution(bytes32 caseId)
        internal
        view
        returns (IMediationRegistry.Resolution)
    {
        return mediationRegistry.getResolution(caseId);
    }

    function _canExecute(bytes32 caseId) internal view returns (bool) {
        return mediationRegistry.canExecute(caseId);
    }
}
