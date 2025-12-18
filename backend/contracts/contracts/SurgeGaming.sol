// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SurgeGaming
 * @dev Decentralized gaming platform with escrow for pay-before-queue
 * @notice Players deposit ETH to escrow, winner gets 75%, platform gets 25%
 */
contract SurgeGaming is ReentrancyGuard, Pausable, Ownable {
    // ============ State Variables ============

    /// @notice Platform wallet that receives fees
    address public constant PLATFORM_WALLET =
        0xFE13B060897b5daBbC866C312A6839C007d181fB;

    /// @notice Backend oracle address that can submit scores
    address public backendOracle;

    /// @notice Minimum stake amount (0.0001 ETH)
    uint256 public constant MIN_STAKE = 0.0001 ether;

    /// @notice Match timeout duration (5 minutes)
    uint256 public constant MATCH_TIMEOUT = 5 minutes;

    /// @notice Platform fee percentage (25%)
    uint256 public constant PLATFORM_FEE_PERCENT = 25;

    /// @notice Accumulated platform fees
    uint256 public accumulatedFees;

    // ============ Enums ============

    enum MatchStatus {
        Pending,
        Active,
        Completed,
        Cancelled,
        Draw
    }

    // ============ Structs ============

    struct Match {
        string matchId;
        address player1;
        address player2;
        uint256 stake;
        uint8 player1Score;
        uint8 player2Score;
        address winner;
        MatchStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        bool player1Withdrawn;
        bool player2Withdrawn;
    }

    struct Deposit {
        address player;
        uint256 amount;
        uint256 depositedAt;
        bool refunded;
        string matchId; // Empty if not yet matched
    }

    // ============ Storage ============

    /// @notice Mapping of matchId to Match struct
    mapping(string => Match) public matches;

    /// @notice Track if a matchId exists
    mapping(string => bool) public matchExists;

    /// @notice Player deposits: depositId => Deposit
    mapping(string => Deposit) public deposits;

    /// @notice Track if a depositId exists
    mapping(string => bool) public depositExists;

    /// @notice Player stats
    mapping(address => PlayerStats) public playerStats;

    struct PlayerStats {
        uint256 wins;
        uint256 losses;
        uint256 totalEarnings;
        uint256 totalStaked;
    }

    // ============ Events ============

    event StakeDeposited(
        string indexed depositId,
        address indexed player,
        uint256 amount,
        uint256 depositedAt
    );

    event StakeRefunded(
        string indexed depositId,
        address indexed player,
        uint256 amount
    );

    event MatchCreated(
        string indexed matchId,
        address indexed player1,
        address indexed player2,
        uint256 stake,
        uint256 createdAt
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

    event DrawDeclared(string indexed matchId, uint256 refundPerPlayer);

    event Withdrawal(
        string indexed matchId,
        address indexed player,
        uint256 amount
    );

    event PlatformFeesWithdrawn(address indexed to, uint256 amount);

    event BackendOracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );

    // ============ Modifiers ============

    modifier onlyBackend() {
        require(
            msg.sender == backendOracle ||
                msg.sender == PLATFORM_WALLET ||
                msg.sender == owner(),
            "Only backend can call this"
        );
        _;
    }

    modifier matchMustExist(string memory matchId) {
        require(matchExists[matchId], "Match does not exist");
        _;
    }

    // ============ Constructor ============

    constructor(address _backendOracle) Ownable(msg.sender) {
        require(_backendOracle != address(0), "Invalid backend oracle");
        backendOracle = _backendOracle;
    }

    // ============ Escrow Functions ============

    /**
     * @notice Deposit stake to escrow before joining queue
     * @param depositId Unique identifier for this deposit
     */
    function depositStake(
        string memory depositId
    ) external payable whenNotPaused nonReentrant {
        require(!depositExists[depositId], "Deposit already exists");
        require(msg.value >= MIN_STAKE, "Stake below minimum");
        require(msg.value > 0, "Must send stake");

        deposits[depositId] = Deposit({
            player: msg.sender,
            amount: msg.value,
            depositedAt: block.timestamp,
            refunded: false,
            matchId: ""
        });

        depositExists[depositId] = true;
        playerStats[msg.sender].totalStaked += msg.value;

        emit StakeDeposited(depositId, msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Refund stake if player cancels or no match found
     * @param depositId Deposit identifier
     */
    function refundStake(
        string memory depositId
    ) external nonReentrant {
        require(depositExists[depositId], "Deposit does not exist");
        Deposit storage deposit = deposits[depositId];
        
        require(deposit.player == msg.sender, "Not your deposit");
        require(!deposit.refunded, "Already refunded");
        require(bytes(deposit.matchId).length == 0, "Already in match");

        deposit.refunded = true;
        playerStats[msg.sender].totalStaked -= deposit.amount;

        (bool success, ) = payable(msg.sender).call{value: deposit.amount}("");
        require(success, "Refund failed");

        emit StakeRefunded(depositId, msg.sender, deposit.amount);
    }

    /**
     * @notice Create match from two deposits (called by backend)
     * @param matchId Match identifier
     * @param depositId1 First player's deposit
     * @param depositId2 Second player's deposit
     */
    function createMatchFromDeposits(
        string memory matchId,
        string memory depositId1,
        string memory depositId2
    ) external onlyBackend nonReentrant {
        require(!matchExists[matchId], "Match already exists");
        require(depositExists[depositId1], "Deposit 1 does not exist");
        require(depositExists[depositId2], "Deposit 2 does not exist");

        Deposit storage deposit1 = deposits[depositId1];
        Deposit storage deposit2 = deposits[depositId2];

        require(!deposit1.refunded, "Deposit 1 refunded");
        require(!deposit2.refunded, "Deposit 2 refunded");
        require(deposit1.amount == deposit2.amount, "Stakes must match");
        require(bytes(deposit1.matchId).length == 0, "Deposit 1 already in match");
        require(bytes(deposit2.matchId).length == 0, "Deposit 2 already in match");

        // Link deposits to match
        deposit1.matchId = matchId;
        deposit2.matchId = matchId;

        matches[matchId] = Match({
            matchId: matchId,
            player1: deposit1.player,
            player2: deposit2.player,
            stake: deposit1.amount,
            player1Score: 0,
            player2Score: 0,
            winner: address(0),
            status: MatchStatus.Active,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + MATCH_TIMEOUT,
            player1Withdrawn: false,
            player2Withdrawn: false
        });

        matchExists[matchId] = true;

        emit MatchCreated(matchId, deposit1.player, deposit2.player, deposit1.amount, block.timestamp);
    }

    // ============ Score Submission (Backend Only) ============

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

        uint256 totalPot = matchData.stake * 2;
        uint256 platformFee;
        uint256 payout;

        if (matchData.player1Score == matchData.player2Score) {
            require(
                winner == address(0),
                "Winner must be zero address for draw"
            );
            matchData.status = MatchStatus.Draw;
            matchData.winner = address(0);
            platformFee = 0;
            payout = matchData.stake;

            emit DrawDeclared(matchId, matchData.stake);
        } else {
            require(
                winner == matchData.player1 || winner == matchData.player2,
                "Invalid winner"
            );
            require(
                (winner == matchData.player1 &&
                    matchData.player1Score > matchData.player2Score) ||
                    (winner == matchData.player2 &&
                        matchData.player2Score > matchData.player1Score),
                "Winner score must be higher"
            );

            matchData.winner = winner;
            matchData.status = MatchStatus.Completed;

            platformFee = (totalPot * PLATFORM_FEE_PERCENT) / 100;
            payout = totalPot - platformFee;

            address loser = (winner == matchData.player1)
                ? matchData.player2
                : matchData.player1;
            playerStats[winner].wins += 1;
            playerStats[winner].totalEarnings += payout;
            playerStats[loser].losses += 1;

            emit WinnerDeclared(matchId, winner, payout, platformFee);
        }
    }

    // ============ Withdrawals ============

    function withdraw(
        string memory matchId
    ) external nonReentrant matchMustExist(matchId) {
        Match storage matchData = matches[matchId];

        require(
            matchData.status == MatchStatus.Completed,
            "Match not completed"
        );
        require(msg.sender == matchData.winner, "Only winner can withdraw");
        require(
            !matchData.player1Withdrawn && !matchData.player2Withdrawn,
            "Already withdrawn"
        );

        matchData.player1Withdrawn = true;
        matchData.player2Withdrawn = true;

        uint256 totalPot = matchData.stake * 2;
        uint256 platformFee = (totalPot * PLATFORM_FEE_PERCENT) / 100;
        uint256 payout = totalPot - platformFee;

        (bool feeSuccess, ) = payable(PLATFORM_WALLET).call{value: platformFee}(
            ""
        );
        require(feeSuccess, "Platform fee transfer failed");

        (bool payoutSuccess, ) = payable(msg.sender).call{value: payout}("");
        require(payoutSuccess, "Winner payout transfer failed");

        emit Withdrawal(matchId, msg.sender, payout);
        emit PlatformFeesWithdrawn(PLATFORM_WALLET, platformFee);
    }

    function withdrawDraw(
        string memory matchId
    ) external nonReentrant matchMustExist(matchId) {
        Match storage matchData = matches[matchId];

        require(matchData.status == MatchStatus.Draw, "Match is not a draw");
        require(
            msg.sender == matchData.player1 || msg.sender == matchData.player2,
            "Not a player in this match"
        );

        bool isPlayer1 = (msg.sender == matchData.player1);

        if (isPlayer1) {
            require(!matchData.player1Withdrawn, "Player1 already withdrawn");
            matchData.player1Withdrawn = true;
        } else {
            require(!matchData.player2Withdrawn, "Player2 already withdrawn");
            matchData.player2Withdrawn = true;
        }

        (bool success, ) = payable(msg.sender).call{value: matchData.stake}("");
        require(success, "Transfer failed");

        emit Withdrawal(matchId, msg.sender, matchData.stake);
    }

    // ============ Admin Functions ============

    function setBackendOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid address");
        address oldOracle = backendOracle;
        backendOracle = newOracle;
        emit BackendOracleUpdated(oldOracle, newOracle);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function getMatch(
        string memory matchId
    ) external view returns (Match memory) {
        require(matchExists[matchId], "Match does not exist");
        return matches[matchId];
    }

    function getDeposit(
        string memory depositId
    ) external view returns (Deposit memory) {
        require(depositExists[depositId], "Deposit does not exist");
        return deposits[depositId];
    }

    function getPlayerStats(
        address player
    ) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function calculatePayout(
        uint256 stakeAmount
    ) external pure returns (uint256 winnerPayout, uint256 platformFee) {
        uint256 totalPot = stakeAmount * 2;
        platformFee = (totalPot * PLATFORM_FEE_PERCENT) / 100;
        winnerPayout = totalPot - platformFee;
    }

    // ============ Receive & Fallback ============

    receive() external payable {
        revert("Direct deposits not allowed");
    }

    fallback() external payable {
        revert("Invalid function call");
    }
}
