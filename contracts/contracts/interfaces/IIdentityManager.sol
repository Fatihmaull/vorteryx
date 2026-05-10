// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IIdentityManager
 * @notice Interface for the IdentityManager contract, enabling cross-contract
 *         credential verification. Used by VotingEngine to validate voter eligibility.
 */
interface IIdentityManager {
    /**
     * @notice Checks if a user is verified and has the required regional domicile.
     * @param _user The address of the user to check.
     * @param _requiredRegion The region string that must match the user's domicile.
     * @return True if the user is verified AND their domicile matches the required region.
     */
    function checkCredential(
        address _user,
        string calldata _requiredRegion
    ) external view returns (bool);

    /**
     * @notice Checks if a user has a registered identity.
     * @param _user The address of the user to check.
     * @return True if the user has registered their KTP.
     */
    function isRegistered(address _user) external view returns (bool);

    /**
     * @notice Checks if a user's identity has been verified by admin.
     * @param _user The address of the user to check.
     * @return True if the user's KTP is verified.
     */
    function isVerified(address _user) external view returns (bool);
}
