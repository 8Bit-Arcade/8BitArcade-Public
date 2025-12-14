// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./EightBitToken.sol";

/**
 * @title Staking
 * @notice 8-Bit Arcade Staking Contract - 5 Year Distribution
 * @dev Allows users to stake 8BIT tokens and earn rewards over 5 years
 *
 * Key Parameters:
 * - Total Staking Pool: 50,000,000 8BIT (10% of max supply)
 * - Distribution Period: 5 years (60 months)
 * - Monthly Distribution: 833,333 8BIT
 * - Matches the 5-year rewards distribution schedule
 */
contract Staking is Ownable, ReentrancyGuard {
    EightBitToken public token;

    /// @notice Total staking pool allocated for 5-year distribution
    uint256 public constant TOTAL_STAKING_POOL = 50_000_000 * 10**18; // 50M 8BIT

    /// @notice Monthly reward distribution (50M / 60 months)
    uint256 public constant MONTHLY_REWARDS = 833_333 * 10**18; // ~833,333 8BIT per month

    /// @notice Distribution period in seconds (5 years)
    uint256 public constant DISTRIBUTION_PERIOD = 5 * 365 days;

    /// @notice Timestamp when staking started
    uint256 public stakingStartTime;

    /// @notice Total amount currently staked
    uint256 public totalStaked;

    /// @notice Total rewards distributed so far
    uint256 public totalRewardsDistributed;

    /// @notice Last time rewards were calculated
    uint256 public lastRewardTime;

    /// @notice Accumulated reward per token staked
    uint256 public rewardPerTokenStored;

    /// @notice User staking information
    struct StakeInfo {
        uint256 amount;              // Amount of tokens staked
        uint256 rewardPerTokenPaid;  // Last calculated reward per token
        uint256 rewards;             // Pending rewards
        uint256 stakedAt;            // Timestamp when staked
    }

    /// @notice Mapping of user addresses to their stake info
    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event StakingStarted(uint256 timestamp);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = EightBitToken(_token);
    }

    /**
     * @notice Start the staking period
     * @dev Can only be called once by owner
     */
    function startStaking() external onlyOwner {
        require(stakingStartTime == 0, "Staking already started");
        stakingStartTime = block.timestamp;
        lastRewardTime = block.timestamp;
        emit StakingStarted(block.timestamp);
    }

    /**
     * @notice Calculate current reward per token
     * @return Current reward per token value
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }

        uint256 timeElapsed = block.timestamp - lastRewardTime;
        uint256 rewardRate = getRewardRate();
        uint256 rewardPerSec = rewardRate / 30 days; // Monthly rate to per-second

        return rewardPerTokenStored + (rewardPerSec * timeElapsed * 1e18 / totalStaked);
    }

    /**
     * @notice Get current monthly reward rate
     * @return Monthly reward amount
     */
    function getRewardRate() public view returns (uint256) {
        if (stakingStartTime == 0) return 0;

        uint256 timeElapsed = block.timestamp - stakingStartTime;

        // If distribution period ended, no more rewards
        if (timeElapsed >= DISTRIBUTION_PERIOD) {
            return 0;
        }

        // If we've distributed all rewards, stop
        if (totalRewardsDistributed >= TOTAL_STAKING_POOL) {
            return 0;
        }

        return MONTHLY_REWARDS;
    }

    /**
     * @notice Calculate earned rewards for a user
     * @param account User address
     * @return Amount of rewards earned
     */
    function earned(address account) public view returns (uint256) {
        StakeInfo memory stake = stakes[account];
        return (stake.amount * (rewardPerToken() - stake.rewardPerTokenPaid) / 1e18) + stake.rewards;
    }

    /**
     * @notice Update reward calculations
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastRewardTime = block.timestamp;

        if (account != address(0)) {
            stakes[account].rewards = earned(account);
            stakes[account].rewardPerTokenPaid = rewardPerTokenStored;
        }
        _;
    }

    /**
     * @notice Stake tokens
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(stakingStartTime > 0, "Staking not started");
        require(amount > 0, "Cannot stake 0");
        require(block.timestamp < stakingStartTime + DISTRIBUTION_PERIOD, "Staking period ended");

        totalStaked += amount;
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].stakedAt = block.timestamp;

        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Withdraw staked tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked balance");

        totalStaked -= amount;
        stakes[msg.sender].amount -= amount;

        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Claim earned rewards
     */
    function claimReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = stakes[msg.sender].rewards;
        require(reward > 0, "No rewards to claim");
        require(totalRewardsDistributed + reward <= TOTAL_STAKING_POOL, "Exceeds staking pool");

        stakes[msg.sender].rewards = 0;
        totalRewardsDistributed += reward;

        // Mint rewards to user
        token.mintReward(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @notice Withdraw all staked tokens and claim rewards
     */
    function exit() external {
        withdraw(stakes[msg.sender].amount);
        claimReward();
    }

    /**
     * @notice Get user's staked amount
     * @param account User address
     * @return Staked amount
     */
    function balanceOf(address account) external view returns (uint256) {
        return stakes[account].amount;
    }

    /**
     * @notice Calculate APY based on current total staked
     * @return APY in basis points (e.g., 2000 = 20%)
     */
    function getCurrentAPY() external view returns (uint256) {
        if (totalStaked == 0) return 0;

        uint256 annualRewards = MONTHLY_REWARDS * 12;
        return (annualRewards * 10000) / totalStaked;
    }

    /**
     * @notice Get remaining time in staking period
     * @return Seconds remaining
     */
    function getRemainingTime() external view returns (uint256) {
        if (stakingStartTime == 0) return DISTRIBUTION_PERIOD;

        uint256 endTime = stakingStartTime + DISTRIBUTION_PERIOD;
        if (block.timestamp >= endTime) return 0;

        return endTime - block.timestamp;
    }

    /**
     * @notice Get staking statistics
     * @return stats Array of staking stats
     */
    function getStakingStats() external view returns (uint256[5] memory stats) {
        stats[0] = totalStaked;
        stats[1] = totalRewardsDistributed;
        stats[2] = TOTAL_STAKING_POOL - totalRewardsDistributed; // Remaining pool
        stats[3] = stakingStartTime;
        stats[4] = getRewardRate();
        return stats;
    }
}
