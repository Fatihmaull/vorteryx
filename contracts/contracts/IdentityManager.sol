// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IIdentityManager} from "./interfaces/IIdentityManager.sol";

/**
 * @title IdentityManager
 * @author VoteryX Team
 * @notice On-chain KTP (Digital Identity) registry with admin verification.
 * @dev Implements IIdentityManager for cross-contract credential validation.
 *      Uses Checks-Effects-Interactions pattern and custom errors for gas efficiency.
 */
contract IdentityManager is IIdentityManager, Ownable {
    // ═══════════════════════════════════════════════════════════════════════
    //                            CUSTOM ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Thrown when a wallet tries to register but already has a KTP.
    error AlreadyRegistered();

    /// @notice Thrown when the provided NIK is already used by another wallet.
    error NIKAlreadyUsed();

    /// @notice Thrown when an operation requires a registered user but none is found.
    error NotRegistered();

    /// @notice Thrown when trying to verify an already verified user.
    error AlreadyVerified();

    /// @notice Thrown when trying to revoke a user that is not verified.
    error NotVerified();

    /// @notice Thrown when name is empty.
    error InvalidName();

    /// @notice Thrown when NIK is invalid (must be 16 digits).
    error InvalidNIK();

    /// @notice Thrown when domicile is empty.
    error InvalidDomisili();

    // ═══════════════════════════════════════════════════════════════════════
    //                              STRUCTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Represents a citizen's digital identity (KTP On-chain).
    struct KTP {
        string nama;
        uint256 nik;
        string domisili;
        bool isVerified;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                               STATE
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Maps wallet address to their KTP data.
    mapping(address => KTP) private _identities;

    /// @notice Tracks which NIKs have been used to prevent duplicates.
    mapping(uint256 => bool) private _nikUsed;

    /// @notice Tracks all registered addresses for enumeration.
    address[] private _registeredUsers;

    /// @notice Maps address to index in _registeredUsers array (1-indexed for zero-check).
    mapping(address => uint256) private _userIndex;

    /// @notice Total number of registered users.
    uint256 public totalRegistered;

    /// @notice Total number of verified users.
    uint256 public totalVerified;

    // ═══════════════════════════════════════════════════════════════════════
    //                              EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Emitted when a new identity is registered.
    event IdentityRegistered(
        address indexed user,
        uint256 indexed nik,
        string nama,
        string domisili
    );

    /// @notice Emitted when an identity is verified by admin.
    event IdentityVerified(address indexed user, uint256 indexed nik);

    /// @notice Emitted when an identity verification is revoked by admin.
    event IdentityRevoked(address indexed user, uint256 indexed nik);

    // ═══════════════════════════════════════════════════════════════════════
    //                           CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Deploys the IdentityManager with the specified owner.
     * @param _owner The address that will be set as the contract owner (admin).
     */
    constructor(address _owner) Ownable(_owner) {}

    // ═══════════════════════════════════════════════════════════════════════
    //                        PUBLIC FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Register a new digital identity (KTP) on-chain.
     * @dev One wallet can only have one identity. NIK must be unique across all users.
     * @param _nama Full name of the citizen.
     * @param _nik 16-digit National Identity Number (NIK).
     * @param _domisili Region/province of domicile.
     */
    function registerIdentity(
        string calldata _nama,
        uint256 _nik,
        string calldata _domisili
    ) external {
        // Checks
        if (_identities[msg.sender].nik != 0) revert AlreadyRegistered();
        if (_nikUsed[_nik]) revert NIKAlreadyUsed();
        if (bytes(_nama).length == 0) revert InvalidName();
        if (_nik < 1000000000000000 || _nik > 9999999999999999)
            revert InvalidNIK();
        if (bytes(_domisili).length == 0) revert InvalidDomisili();

        // Effects
        _identities[msg.sender] = KTP({
            nama: _nama,
            nik: _nik,
            domisili: _domisili,
            isVerified: false
        });
        _nikUsed[_nik] = true;

        _registeredUsers.push(msg.sender);
        _userIndex[msg.sender] = _registeredUsers.length; // 1-indexed

        unchecked {
            ++totalRegistered;
        }

        emit IdentityRegistered(msg.sender, _nik, _nama, _domisili);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                        ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Verify a registered user's identity. Only callable by admin.
     * @param _user The address of the user to verify.
     */
    function verifyUser(address _user) external onlyOwner {
        KTP storage ktp = _identities[_user];
        if (ktp.nik == 0) revert NotRegistered();
        if (ktp.isVerified) revert AlreadyVerified();

        ktp.isVerified = true;

        unchecked {
            ++totalVerified;
        }

        emit IdentityVerified(_user, ktp.nik);
    }

    /**
     * @notice Revoke a user's verification. Only callable by admin.
     * @param _user The address of the user whose verification to revoke.
     */
    function revokeUser(address _user) external onlyOwner {
        KTP storage ktp = _identities[_user];
        if (ktp.nik == 0) revert NotRegistered();
        if (!ktp.isVerified) revert NotVerified();

        ktp.isVerified = false;

        unchecked {
            --totalVerified;
        }

        emit IdentityRevoked(_user, ktp.nik);
    }

    /**
     * @notice Batch verify multiple users at once. Only callable by admin.
     * @param _users Array of addresses to verify.
     */
    function batchVerifyUsers(address[] calldata _users) external onlyOwner {
        uint256 len = _users.length;
        uint256 verifiedCount;

        for (uint256 i; i < len; ) {
            KTP storage ktp = _identities[_users[i]];
            if (ktp.nik != 0 && !ktp.isVerified) {
                ktp.isVerified = true;
                emit IdentityVerified(_users[i], ktp.nik);
                unchecked {
                    ++verifiedCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        unchecked {
            totalVerified += verifiedCount;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                         VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Check if a user has valid credentials for a specific region.
     * @param _user The address of the user to check.
     * @param _requiredRegion The region the user must be domiciled in.
     * @return True if user is verified and domicile matches.
     */
    function checkCredential(
        address _user,
        string calldata _requiredRegion
    ) external view override returns (bool) {
        KTP storage ktp = _identities[_user];
        if (!ktp.isVerified) return false;

        return
            keccak256(abi.encodePacked(ktp.domisili)) ==
            keccak256(abi.encodePacked(_requiredRegion));
    }

    /**
     * @notice Get the full identity data for a user.
     * @param _user The address of the user.
     * @return nama The user's full name.
     * @return nik The user's NIK.
     * @return domisili The user's domicile region.
     * @return userIsVerified Whether the user is verified.
     */
    function getIdentity(
        address _user
    )
        external
        view
        returns (
            string memory nama,
            uint256 nik,
            string memory domisili,
            bool userIsVerified
        )
    {
        KTP storage ktp = _identities[_user];
        return (ktp.nama, ktp.nik, ktp.domisili, ktp.isVerified);
    }

    /**
     * @inheritdoc IIdentityManager
     */
    function isRegistered(
        address _user
    ) external view override returns (bool) {
        return _identities[_user].nik != 0;
    }

    /**
     * @inheritdoc IIdentityManager
     */
    function isVerified(address _user) external view override returns (bool) {
        return _identities[_user].isVerified;
    }

    /**
     * @notice Get a paginated list of registered user addresses.
     * @param _offset Starting index.
     * @param _limit Maximum number of addresses to return.
     * @return users Array of registered user addresses.
     */
    function getRegisteredUsers(
        uint256 _offset,
        uint256 _limit
    ) external view returns (address[] memory users) {
        uint256 len = _registeredUsers.length;
        if (_offset >= len) return new address[](0);

        uint256 end = _offset + _limit;
        if (end > len) end = len;
        uint256 resultLen = end - _offset;

        users = new address[](resultLen);
        for (uint256 i; i < resultLen; ) {
            users[i] = _registeredUsers[_offset + i];
            unchecked {
                ++i;
            }
        }
    }
}
