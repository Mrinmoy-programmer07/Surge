// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SurgeGaming
 * @dev Decentralized gaming platform for skill-based games with real money stakes
 * @notice Players deposit CELO, winner gets 75%, platform gets 25%
 */
contract SurgeGaming is ReentrancyGuard, Pausable, Ownable {
    // ============ State Variables ============

    /// @notice Platform wallet that receives fees
    address public constant PLATFORM_WALLET =
        0xC0Aa6fb8641c2b014d86112dB098AAb17bcc9b13;

    /// @notice Backend oracle address that can submit scores
    address public backendOracle;

    /// @notice Minimum stake amount (0.1 CELO)
    uint256 public constant MIN_STAKE = 0.1 ether;

    /// @notice Match timeout duration (5 minutes)
    uint256 public constant MATCH_TIMEOUT = 5 minutes;

    /// @notice Platform fee percentage (25%)
    uint256 public constant PLATFORM_FEE_PERCENT = 25;

    /// @notice Accumulated platform fees
    uint256 public accumulatedFees;

    // ============ Enums ============

    enum MatchStatus {
        Pending, // Waiting for second player
        Active, // Both players joined, game in progress
        Completed, // Game finished, winner declared
        Cancelled // Timeout or cancelled
    }

    // ============ Structs ============

    struct Match {
        string matchId; // Unique match identifier
        address player1; // First player address
        address player2; // Second player address (null if pending)
        uint256 stake; // Stake amount per player
        uint8 player1Score; // Player 1's game score
        uint8 player2Score; // Player 2's game score
        address winner; // Winner address (null until declared)
        MatchStatus status; // Current match status
        uint256 createdAt; // Match creation timestamp
        uint256 expiresAt; // Match expiration timestamp
        bool withdrawn; // Whether winner has withdrawn
    }

    // ============ Storage ============

    /// @notice Mapping of matchId to Match struct
    mapping(string => Match) public matches;

    /// @notice Track if a matchId exists
    mapping(string => bool) public matchExists;

    /// @notice Player stats: address => (wins, losses, totalEarnings)
    mapping(address => PlayerStats) public playerStats;

    struct PlayerStats {
        uint256 wins;
        uint256 losses;
        uint256 totalEarnings;
        uint256 totalStaked;
    }

    // ============ Events ============

    event MatchCreated(
        string indexed matchId,
        address indexed player1,
        uint256 stake,
        uint256 createdAt
    );

    event MatchJoined(
        string indexed matchId,
        address indexed player2,
        uint256 totalPot
    );

    event ScoreSubmitted(
        string indexed matchId,
        address indexed player,
        uint8 score
    );

    event WinnerDeclared(
        string indexed matchId,
        address indexed winner,
        uint256 payout,
        uint256 platformFee
    );

    event MatchCancelled(
        string indexed matchId,
        address indexed player,
        uint256 refundAmount,
        string reason
    );

    event Withdrawal(
        string indexed matchId,
        address indexed winner,
        uint256 amount
    );

    event PlatformFeesWithdrawn(address indexed to, uint256 amount);

    event BackendOracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );

    // ============ Modifiers ============

    modifier onlyBackend() {
        require(msg.sender == backendOracle, "Only backend can call this");
        _;
    }

    modifier matchMustExist(string memory matchId) {
        require(matchExists[matchId], "Match does not exist");
        _;
    }

    modifier matchNotExpired(string memory matchId) {
        require(
            block.timestamp <= matches[matchId].expiresAt,
            "Match has expired"
        );
        _;
    }

    // ============ Constructor ============

    constructor(address _backendOracle) Ownable(msg.sender) {
        require(_backendOracle != address(0), "Invalid backend oracle");
        backendOracle = _backendOracle;
    }

    // ============ Match Creation & Joining ============

    /**
     * @notice Create a new match with stake deposit
     * @param matchId Unique identifier for the match
     */
    function createMatch(
        string memory matchId
    ) external payable whenNotPaused nonReentrant {
        require(!matchExists[matchId], "Match already exists");
        require(msg.value >= MIN_STAKE, "Stake below minimum");
        require(msg.value > 0, "Must send stake");

        matches[matchId] = Match({
            matchId: matchId,
            player1: msg.sender,
            player2: address(0),
            stake: msg.value,
            player1Score: 0,
            player2Score: 0,
            winner: address(0),
            status: MatchStatus.Pending,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + MATCH_TIMEOUT,
            withdrawn: false
        });

        matchExists[matchId] = true;

        playerStats[msg.sender].totalStaked += msg.value;

        emit MatchCreated(matchId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Join an existing pending match
     * @param matchId Match identifier to join
     */
    function joinMatch(
        string memory matchId
    )
        external
        payable
        whenNotPaused
        nonReentrant
        matchMustExist(matchId)
        matchNotExpired(matchId)
    {
        Match storage matchData = matches[matchId];

        require(matchData.status == MatchStatus.Pending, "Match not available");
        require(matchData.player2 == address(0), "Match already full");
        require(
            msg.sender != matchData.player1,
            "Cannot play against yourself"
        );
        require(msg.value == matchData.stake, "Stake must match");

        matchData.player2 = msg.sender;
        matchData.status = MatchStatus.Active;
        matchData.expiresAt = block.timestamp + MATCH_TIMEOUT; // Reset timeout

        playerStats[msg.sender].totalStaked += msg.value;

        uint256 totalPot = matchData.stake * 2;

        emit MatchJoined(matchId, msg.sender, totalPot);
    }

    // ============ Score Submission (Backend Only) ============

    /**
     * @notice Submit player score (called by backend oracle)
     * @param matchId Match identifier
     * @param player Player address
     * @param score Player's game score
     */
    function submitScore(
        string memory matchId,
        address player,
        uint8 score
    ) external onlyBackend matchMustExist(matchId) {
        Match storage matchData = matches[matchId];

        require(matchData.status == MatchStatus.Active, "Match not active");
        require(
            player == matchData.player1 || player == matchData.player2,
            "Invalid player"
        );

        if (player == matchData.player1) {
            require(matchData.player1Score == 0, "Score already submitted");
            matchData.player1Score = score;
        } else {
            require(matchData.player2Score == 0, "Score already submitted");
            matchData.player2Score = score;
        }

        emit ScoreSubmitted(matchId, player, score);
    }

    /**
     * @notice Declare winner after both scores submitted (called by backend)
     * @param matchId Match identifier
     * @param winner Winner's address
     */
    function declareWinner(
        string memory matchId,
        address winner
    ) external onlyBackend matchMustExist(matchId) nonReentrant {
        Match storage matchData = matches[matchId];

        require(matchData.status == MatchStatus.Active, "Match not active");
        require(
            matchData.player1Score > 0 || matchData.player2Score > 0,
            "No scores submitted"
        );
        require(
            winner == matchData.player1 || winner == matchData.player2,
            "Invalid winner"
        );

        matchData.winner = winner;
        matchData.status = MatchStatus.Completed;

        uint256 totalPot = matchData.stake * 2;
        uint256 platformFee;
        uint256 winnerPayout;

        // Check for draw
        if (matchData.player1Score == matchData.player2Score) {
            // Draw: both players get stake back, no platform fee
            winnerPayout = matchData.stake;
            platformFee = 0;
        } else {
            // Normal win: 75% to winner, 25% to platform
            platformFee = (totalPot * PLATFORM_FEE_PERCENT) / 100;
            winnerPayout = totalPot - platformFee;
            accumulatedFees += platformFee;
        }

        // Update stats
        address loser = (winner == matchData.player1)
            ? matchData.player2
            : matchData.player1;
        playerStats[winner].wins += 1;
        playerStats[winner].totalEarnings += winnerPayout;

        if (matchData.player1Score != matchData.player2Score) {
            playerStats[loser].losses += 1;
        }

        emit WinnerDeclared(matchId, winner, winnerPayout, platformFee);
    }

    // ============ Withdrawals ============

    /**
     * @notice Winner withdraws their payout
     * @param matchId Match identifier
     */
    function withdraw(
        string memory matchId
    ) external nonReentrant matchMustExist(matchId) {
        Match storage matchData = matches[matchId];

        require(
            matchData.status == MatchStatus.Completed,
            "Match not completed"
        );
        require(msg.sender == matchData.winner, "Only winner can withdraw");
        require(!matchData.withdrawn, "Already withdrawn");

        matchData.withdrawn = true;

        uint256 totalPot = matchData.stake * 2;
        uint256 payout;

        // Check if it was a draw
        if (matchData.player1Score == matchData.player2Score) {
            payout = matchData.stake; // Just return their stake
        } else {
            uint256 platformFee = (totalPot * PLATFORM_FEE_PERCENT) / 100;
            payout = totalPot - platformFee;
        }

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit Withdrawal(matchId, msg.sender, payout);
    }

    /**
     * @notice Withdraw in case of draw (both players)
     * @param matchId Match identifier
     */
    function withdrawDraw(
        string memory matchId
    ) external nonReentrant matchMustExist(matchId) {
        Match storage matchData = matches[matchId];

        require(
            matchData.status == MatchStatus.Completed,
            "Match not completed"
        );
        require(matchData.player1Score == matchData.player2Score, "Not a draw");
        require(
            msg.sender == matchData.player1 || msg.sender == matchData.player2,
            "Not a player in this match"
        );
        require(!matchData.withdrawn, "Already withdrawn");

        matchData.withdrawn = true;

        // Both players get their stake back
        (bool success1, ) = payable(matchData.player1).call{
            value: matchData.stake
        }("");
        require(success1, "Transfer to player1 failed");

        (bool success2, ) = payable(matchData.player2).call{
            value: matchData.stake
        }("");
        require(success2, "Transfer to player2 failed");

        emit Withdrawal(matchId, matchData.player1, matchData.stake);
        emit Withdrawal(matchId, matchData.player2, matchData.stake);
    }

    // ============ Timeout & Cancellation ============

    /**
     * @notice Cancel match if second player never joins (timeout)
     * @param matchId Match identifier
     */
    function cancelPendingMatch(
        string memory matchId
    ) external nonReentrant matchMustExist(matchId) {
        Match storage matchData = matches[matchId];

        require(matchData.status == MatchStatus.Pending, "Match not pending");
        require(block.timestamp > matchData.expiresAt, "Match not expired yet");
        require(msg.sender == matchData.player1, "Only player1 can cancel");

        matchData.status = MatchStatus.Cancelled;

        uint256 refund = matchData.stake;
        playerStats[matchData.player1].totalStaked -= refund;

        (bool success, ) = payable(matchData.player1).call{value: refund}("");
        require(success, "Refund failed");

        emit MatchCancelled(
            matchId,
            matchData.player1,
            refund,
            "Timeout - no opponent"
        );
    }

    /**
     * @notice Declare winner by timeout if opponent doesn't submit score
     * @param matchId Match identifier
     */
    function claimWinByTimeout(
        string memory matchId
    ) external nonReentrant matchMustExist(matchId) {
        Match storage matchData = matches[matchId];

        require(matchData.status == MatchStatus.Active, "Match not active");
        require(block.timestamp > matchData.expiresAt, "Match not expired yet");
        require(
            msg.sender == matchData.player1 || msg.sender == matchData.player2,
            "Not a player"
        );

        // Determine winner: whoever submitted a score (or player who calls this wins)
        address winner;
        if (matchData.player1Score > 0 && matchData.player2Score == 0) {
            winner = matchData.player1;
        } else if (matchData.player2Score > 0 && matchData.player1Score == 0) {
            winner = matchData.player2;
        } else {
            // If both or neither submitted, player who calls this wins
            winner = msg.sender;
        }

        matchData.winner = winner;
        matchData.status = MatchStatus.Completed;

        uint256 totalPot = matchData.stake * 2;
        uint256 platformFee = (totalPot * PLATFORM_FEE_PERCENT) / 100;
        uint256 winnerPayout = totalPot - platformFee;

        accumulatedFees += platformFee;

        address loser = (winner == matchData.player1)
            ? matchData.player2
            : matchData.player1;
        playerStats[winner].wins += 1;
        playerStats[winner].totalEarnings += winnerPayout;
        playerStats[loser].losses += 1;

        emit WinnerDeclared(matchId, winner, winnerPayout, platformFee);
    }

    // ============ Platform Fee Management ============

    /**
     * @notice Platform withdraws accumulated fees
     */
    function withdrawPlatformFees() external nonReentrant {
        require(
            msg.sender == PLATFORM_WALLET || msg.sender == owner(),
            "Not authorized"
        );
        require(accumulatedFees > 0, "No fees to withdraw");

        uint256 amount = accumulatedFees;
        accumulatedFees = 0;

        (bool success, ) = payable(PLATFORM_WALLET).call{value: amount}("");
        require(success, "Fee transfer failed");

        emit PlatformFeesWithdrawn(PLATFORM_WALLET, amount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update backend oracle address
     * @param newOracle New backend oracle address
     */
    function setBackendOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid address");
        address oldOracle = backendOracle;
        backendOracle = newOracle;
        emit BackendOracleUpdated(oldOracle, newOracle);
    }

    /**
     * @notice Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get match details
     * @param matchId Match identifier
     */
    function getMatch(
        string memory matchId
    ) external view returns (Match memory) {
        require(matchExists[matchId], "Match does not exist");
        return matches[matchId];
    }

    /**
     * @notice Get player statistics
     * @param player Player address
     */
    function getPlayerStats(
        address player
    ) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    /**
     * @notice Calculate potential payout for a stake amount
     * @param stakeAmount Stake amount
     */
    function calculatePayout(
        uint256 stakeAmount
    ) external pure returns (uint256 winnerPayout, uint256 platformFee) {
        uint256 totalPot = stakeAmount * 2;
        platformFee = (totalPot * PLATFORM_FEE_PERCENT) / 100;
        winnerPayout = totalPot - platformFee;
    }

    /**
     * @notice Check if match has expired
     * @param matchId Match identifier
     */
    function isMatchExpired(
        string memory matchId
    ) external view matchMustExist(matchId) returns (bool) {
        return block.timestamp > matches[matchId].expiresAt;
    }

    // ============ Receive & Fallback ============

    receive() external payable {
        revert("Direct deposits not allowed");
    }

    fallback() external payable {
        revert("Invalid function call");
    }
}
