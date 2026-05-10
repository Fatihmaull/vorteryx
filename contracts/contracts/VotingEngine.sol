// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IIdentityManager} from "./interfaces/IIdentityManager.sol";

/**
 * @title VotingEngine
 * @author VoteryX Team
 * @notice Decentralized voting engine with credential-based access control.
 * @dev Integrates with IdentityManager via IIdentityManager interface for
 *      real-time credential verification before accepting votes.
 *      Supports multiple concurrent elections with per-election vote tracking.
 */
contract VotingEngine is Ownable, ReentrancyGuard {
    // ═══════════════════════════════════════════════════════════════════════
    //                            CUSTOM ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Thrown when the election is not in Active status.
    error ElectionNotActive();

    /// @notice Thrown when the election is not in NotStarted status.
    error ElectionNotPending();

    /// @notice Thrown when the voter has already voted in this election.
    error AlreadyVoted();

    /// @notice Thrown when the voter's region doesn't match the election region.
    error UnauthorizedRegion();

    /// @notice Thrown when the voter is not verified in the IdentityManager.
    error VoterNotVerified();

    /// @notice Thrown when the candidate ID is invalid or doesn't exist.
    error InvalidCandidate();

    /// @notice Thrown when a candidate's region doesn't match the election region.
    error CandidateRegionMismatch();

    /// @notice Thrown when the election ID is invalid.
    error InvalidElection();

    /// @notice Thrown when providing an empty candidate name.
    error InvalidCandidateName();

    /// @notice Thrown when providing an empty region.
    error InvalidRegion();

    /// @notice Thrown when providing an empty election title.
    error InvalidElectionTitle();

    /// @notice Thrown when no candidates are provided for an election.
    error NoCandidatesProvided();

    /// @notice Thrown when the election has already ended.
    error ElectionAlreadyEnded();

    // ═══════════════════════════════════════════════════════════════════════
    //                             ENUMS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Represents the lifecycle status of an election.
    enum ElectionStatus {
        NotStarted,
        Active,
        Ended
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                            STRUCTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Represents a candidate in an election.
    struct Candidate {
        uint256 id;
        string name;
        string region;
        uint256 voteCount;
    }

    /// @notice Represents an election with its own candidate pool and region.
    struct Election {
        uint256 id;
        string title;
        string region;
        ElectionStatus status;
        uint256[] candidateIds;
        uint256 totalVotes;
        uint256 createdAt;
        uint256 startedAt;
        uint256 endedAt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                              STATE
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Reference to the IdentityManager contract (immutable for gas savings).
    IIdentityManager public immutable identityManager;

    /// @notice Maps candidate ID to Candidate data.
    mapping(uint256 => Candidate) public candidates;

    /// @notice Maps election ID to Election data.
    mapping(uint256 => Election) public elections;

    /// @notice Tracks whether a user has voted in a specific election.
    /// @dev mapping(electionId => mapping(voterAddress => hasVoted))
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Auto-incrementing candidate ID counter.
    uint256 public candidateCount;

    /// @notice Auto-incrementing election ID counter.
    uint256 public electionCount;

    // ═══════════════════════════════════════════════════════════════════════
    //                             EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Emitted when a new candidate is added.
    event CandidateAdded(
        uint256 indexed candidateId,
        string name,
        string region
    );

    /// @notice Emitted when a new election is created.
    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        string region
    );

    /// @notice Emitted when an election is started.
    event ElectionStarted(uint256 indexed electionId, uint256 timestamp);

    /// @notice Emitted when an election is ended.
    event ElectionEnded(
        uint256 indexed electionId,
        uint256 timestamp,
        uint256 totalVotes
    );

    /// @notice Emitted when a vote is cast.
    event VoteCast(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        address indexed voter
    );

    // ═══════════════════════════════════════════════════════════════════════
    //                          CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Deploys the VotingEngine with a reference to the IdentityManager.
     * @param _identityManager Address of the deployed IdentityManager contract.
     * @param _owner The address that will be set as the contract owner (admin).
     */
    constructor(
        address _identityManager,
        address _owner
    ) Ownable(_owner) {
        identityManager = IIdentityManager(_identityManager);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                        ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Add a new candidate. Only callable by admin.
     * @param _name Name of the candidate.
     * @param _region Region the candidate is running in.
     * @return candidateId The ID assigned to the new candidate.
     */
    function addCandidate(
        string calldata _name,
        string calldata _region
    ) external onlyOwner returns (uint256 candidateId) {
        if (bytes(_name).length == 0) revert InvalidCandidateName();
        if (bytes(_region).length == 0) revert InvalidRegion();

        unchecked {
            candidateId = ++candidateCount;
        }

        candidates[candidateId] = Candidate({
            id: candidateId,
            name: _name,
            region: _region,
            voteCount: 0
        });

        emit CandidateAdded(candidateId, _name, _region);
    }

    /**
     * @notice Create a new election. Only callable by admin.
     * @param _title Title of the election (e.g., "Pemilihan Gubernur Jakarta 2025").
     * @param _region Region this election applies to.
     * @param _candidateIds Array of candidate IDs participating in this election.
     * @return electionId The ID assigned to the new election.
     */
    function createElection(
        string calldata _title,
        string calldata _region,
        uint256[] calldata _candidateIds
    ) external onlyOwner returns (uint256 electionId) {
        if (bytes(_title).length == 0) revert InvalidElectionTitle();
        if (bytes(_region).length == 0) revert InvalidRegion();
        if (_candidateIds.length == 0) revert NoCandidatesProvided();

        // Validate all candidates exist and their regions match
        uint256 len = _candidateIds.length;
        for (uint256 i; i < len; ) {
            uint256 cId = _candidateIds[i];
            if (candidates[cId].id == 0) revert InvalidCandidate();

            bytes32 candidateRegionHash = keccak256(
                abi.encodePacked(candidates[cId].region)
            );
            bytes32 electionRegionHash = keccak256(
                abi.encodePacked(_region)
            );
            if (candidateRegionHash != electionRegionHash)
                revert CandidateRegionMismatch();

            unchecked {
                ++i;
            }
        }

        unchecked {
            electionId = ++electionCount;
        }

        Election storage election = elections[electionId];
        election.id = electionId;
        election.title = _title;
        election.region = _region;
        election.status = ElectionStatus.NotStarted;
        election.candidateIds = _candidateIds;
        election.createdAt = block.timestamp;

        emit ElectionCreated(electionId, _title, _region);
    }

    /**
     * @notice Start an election (transition from NotStarted → Active). Only callable by admin.
     * @param _electionId The ID of the election to start.
     */
    function startElection(uint256 _electionId) external onlyOwner {
        Election storage election = elections[_electionId];
        if (election.id == 0) revert InvalidElection();
        if (election.status != ElectionStatus.NotStarted)
            revert ElectionNotPending();

        election.status = ElectionStatus.Active;
        election.startedAt = block.timestamp;

        emit ElectionStarted(_electionId, block.timestamp);
    }

    /**
     * @notice End an election (transition from Active → Ended). Only callable by admin.
     * @param _electionId The ID of the election to end.
     */
    function endElection(uint256 _electionId) external onlyOwner {
        Election storage election = elections[_electionId];
        if (election.id == 0) revert InvalidElection();
        if (election.status != ElectionStatus.Active)
            revert ElectionNotActive();

        election.status = ElectionStatus.Ended;
        election.endedAt = block.timestamp;

        emit ElectionEnded(_electionId, block.timestamp, election.totalVotes);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                        VOTING FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Cast a vote in an election. Credential-gated and double-vote protected.
     * @dev Follows CEI pattern. Uses nonReentrant for additional safety.
     * @param _electionId The ID of the election to vote in.
     * @param _candidateId The ID of the candidate to vote for.
     */
    function vote(
        uint256 _electionId,
        uint256 _candidateId
    ) external nonReentrant {
        Election storage election = elections[_electionId];

        // ── Checks ──────────────────────────────────────────────────────
        if (election.id == 0) revert InvalidElection();
        if (election.status != ElectionStatus.Active)
            revert ElectionNotActive();
        if (hasVoted[_electionId][msg.sender]) revert AlreadyVoted();

        // Verify voter credentials via IdentityManager
        if (!identityManager.isVerified(msg.sender)) revert VoterNotVerified();
        if (!identityManager.checkCredential(msg.sender, election.region))
            revert UnauthorizedRegion();

        // Validate candidate belongs to this election
        if (candidates[_candidateId].id == 0) revert InvalidCandidate();
        bool candidateInElection = false;
        uint256 len = election.candidateIds.length;
        for (uint256 i; i < len; ) {
            if (election.candidateIds[i] == _candidateId) {
                candidateInElection = true;
                break;
            }
            unchecked {
                ++i;
            }
        }
        if (!candidateInElection) revert InvalidCandidate();

        // ── Effects ─────────────────────────────────────────────────────
        hasVoted[_electionId][msg.sender] = true;

        unchecked {
            ++candidates[_candidateId].voteCount;
            ++election.totalVotes;
        }

        // ── Interactions (none — pure state change) ─────────────────────
        emit VoteCast(_electionId, _candidateId, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //                        VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Get the full details of a candidate.
     * @param _candidateId The ID of the candidate.
     * @return The Candidate struct.
     */
    function getCandidate(
        uint256 _candidateId
    ) external view returns (Candidate memory) {
        if (candidates[_candidateId].id == 0) revert InvalidCandidate();
        return candidates[_candidateId];
    }

    /**
     * @notice Get the results of an election including all candidate vote counts.
     * @param _electionId The ID of the election.
     * @return title The election title.
     * @return region The election region.
     * @return status The election status.
     * @return totalVotes Total votes cast in this election.
     * @return electionCandidates Array of Candidate structs with vote counts.
     */
    function getElectionResults(
        uint256 _electionId
    )
        external
        view
        returns (
            string memory title,
            string memory region,
            ElectionStatus status,
            uint256 totalVotes,
            Candidate[] memory electionCandidates
        )
    {
        Election storage election = elections[_electionId];
        if (election.id == 0) revert InvalidElection();

        uint256 len = election.candidateIds.length;
        electionCandidates = new Candidate[](len);

        for (uint256 i; i < len; ) {
            electionCandidates[i] = candidates[election.candidateIds[i]];
            unchecked {
                ++i;
            }
        }

        return (
            election.title,
            election.region,
            election.status,
            election.totalVotes,
            electionCandidates
        );
    }

    /**
     * @notice Get all elections.
     * @return allElections Array of Election structs.
     */
    function getAllElections()
        external
        view
        returns (Election[] memory allElections)
    {
        uint256 count = electionCount;
        allElections = new Election[](count);

        for (uint256 i; i < count; ) {
            allElections[i] = elections[i + 1];
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Get all candidates.
     * @return allCandidates Array of Candidate structs.
     */
    function getAllCandidates()
        external
        view
        returns (Candidate[] memory allCandidates)
    {
        uint256 count = candidateCount;
        allCandidates = new Candidate[](count);

        for (uint256 i; i < count; ) {
            allCandidates[i] = candidates[i + 1];
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Get the candidate IDs for a specific election.
     * @param _electionId The ID of the election.
     * @return candidateIds Array of candidate IDs.
     */
    function getElectionCandidateIds(
        uint256 _electionId
    ) external view returns (uint256[] memory) {
        if (elections[_electionId].id == 0) revert InvalidElection();
        return elections[_electionId].candidateIds;
    }
}
