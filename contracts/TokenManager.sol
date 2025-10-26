// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./SettlementContract.sol";

/**
 * @title TokenManager
 * @dev Manages token deposits, withdrawals, and cross-chain transfers
 * @notice This contract handles the actual token movements for settled intents
 */
contract TokenManager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events
    event TokensDeposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        string chain
    );

    event TokensWithdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        string chain
    );

    event CrossChainTransfer(
        bytes32 indexed intentId,
        address indexed from,
        address indexed to,
        address token,
        uint256 amount,
        string fromChain,
        string toChain
    );

    // Structs
    struct TokenInfo {
        address tokenAddress;
        string symbol;
        uint8 decimals;
        bool isActive;
    }

    // State variables
    SettlementContract public settlementContract;
    mapping(string => TokenInfo) public supportedTokens;
    mapping(address => mapping(address => uint256)) public userBalances;
    mapping(bytes32 => bool) public processedTransfers;

    // Modifiers
    modifier onlySettlementContract() {
        require(msg.sender == address(settlementContract), "Only settlement contract");
        _;
    }

    modifier onlySupportedToken(string memory symbol) {
        require(supportedTokens[symbol].isActive, "Token not supported");
        _;
    }

    constructor(address _settlementContract) Ownable(msg.sender) {
        settlementContract = SettlementContract(_settlementContract);
    }

    /**
     * @dev Add or update a supported token
     * @param symbol The token symbol
     * @param tokenAddress The token contract address
     * @param decimals The token decimals
     */
    function addSupportedToken(
        string memory symbol,
        address tokenAddress,
        uint8 decimals
    ) external onlyOwner {
        supportedTokens[symbol] = TokenInfo({
            tokenAddress: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            isActive: true
        });
    }

    /**
     * @dev Remove a supported token
     * @param symbol The token symbol
     */
    function removeSupportedToken(string memory symbol) external onlyOwner {
        supportedTokens[symbol].isActive = false;
    }

    /**
     * @dev Deposit tokens for cross-chain swapping
     * @param tokenSymbol The token symbol to deposit
     * @param amount The amount to deposit
     */
    function depositTokens(
        string memory tokenSymbol,
        uint256 amount
    ) external nonReentrant onlySupportedToken(tokenSymbol) {
        TokenInfo memory tokenInfo = supportedTokens[tokenSymbol];
        IERC20 token = IERC20(tokenInfo.tokenAddress);

        // Transfer tokens from user to this contract
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Update user balance
        userBalances[msg.sender][tokenInfo.tokenAddress] += amount;

        emit TokensDeposited(msg.sender, tokenInfo.tokenAddress, amount, "current");
    }

    /**
     * @dev Withdraw tokens from the contract
     * @param tokenSymbol The token symbol to withdraw
     * @param amount The amount to withdraw
     */
    function withdrawTokens(
        string memory tokenSymbol,
        uint256 amount
    ) external nonReentrant onlySupportedToken(tokenSymbol) {
        TokenInfo memory tokenInfo = supportedTokens[tokenSymbol];
        
        require(
            userBalances[msg.sender][tokenInfo.tokenAddress] >= amount,
            "Insufficient balance"
        );

        // Update user balance
        userBalances[msg.sender][tokenInfo.tokenAddress] -= amount;

        // Transfer tokens to user
        IERC20(tokenInfo.tokenAddress).safeTransfer(msg.sender, amount);

        emit TokensWithdrawn(msg.sender, tokenInfo.tokenAddress, amount, "current");
    }

    /**
     * @dev Process cross-chain transfer for settled intent
     * @param intentId The intent ID
     * @param from The sender address
     * @param to The recipient address
     * @param fromTokenSymbol The source token symbol
     * @param toTokenSymbol The destination token symbol
     * @param amount The amount to transfer
     * @param fromChain The source chain
     * @param toChain The destination chain
     */
    function processCrossChainTransfer(
        bytes32 intentId,
        address from,
        address to,
        string memory fromTokenSymbol,
        string memory toTokenSymbol,
        uint256 amount,
        string memory fromChain,
        string memory toChain
    ) external onlySettlementContract nonReentrant {
        require(!processedTransfers[intentId], "Transfer already processed");

        // Mark transfer as processed
        processedTransfers[intentId] = true;

        // Handle token transfer logic
        if (keccak256(bytes(fromChain)) == keccak256(bytes(toChain))) {
            // Same chain transfer - direct swap
            _processSameChainTransfer(from, to, fromTokenSymbol, toTokenSymbol, amount);
        } else {
            // Cross-chain transfer - handle differently
            _processCrossChainTransfer(from, to, fromTokenSymbol, toTokenSymbol, amount, fromChain, toChain);
        }

        emit CrossChainTransfer(intentId, from, to, supportedTokens[toTokenSymbol].tokenAddress, amount, fromChain, toChain);
    }

    /**
     * @dev Process same-chain token transfer
     */
    function _processSameChainTransfer(
        address from,
        address to,
        string memory fromTokenSymbol,
        string memory toTokenSymbol,
        uint256 amount
    ) internal {
        TokenInfo memory fromToken = supportedTokens[fromTokenSymbol];
        TokenInfo memory toToken = supportedTokens[toTokenSymbol];

        // Deduct from user's balance
        require(
            userBalances[from][fromToken.tokenAddress] >= amount,
            "Insufficient balance"
        );
        userBalances[from][fromToken.tokenAddress] -= amount;

        // Add to recipient's balance
        userBalances[to][toToken.tokenAddress] += amount;
    }

    /**
     * @dev Process cross-chain token transfer
     */
    function _processCrossChainTransfer(
        address from,
        address to,
        string memory fromTokenSymbol,
        string memory toTokenSymbol,
        uint256 amount,
        string memory fromChain,
        string memory toChain
    ) internal {
        // For cross-chain transfers, we would typically:
        // 1. Lock tokens on source chain
        // 2. Send message to destination chain
        // 3. Mint/burn tokens on destination chain
        
        // For now, we'll simulate the transfer
        TokenInfo memory fromToken = supportedTokens[fromTokenSymbol];
        TokenInfo memory toToken = supportedTokens[toTokenSymbol];

        // Deduct from user's balance
        require(
            userBalances[from][fromToken.tokenAddress] >= amount,
            "Insufficient balance"
        );
        userBalances[from][fromToken.tokenAddress] -= amount;

        // Add to recipient's balance (simulating cross-chain transfer)
        userBalances[to][toToken.tokenAddress] += amount;
    }

    /**
     * @dev Get user balance for a token
     * @param user The user address
     * @param tokenSymbol The token symbol
     * @return The user's balance
     */
    function getUserBalance(address user, string memory tokenSymbol) external view returns (uint256) {
        TokenInfo memory tokenInfo = supportedTokens[tokenSymbol];
        return userBalances[user][tokenInfo.tokenAddress];
    }

    /**
     * @dev Get token information
     * @param symbol The token symbol
     * @return TokenInfo The token information
     */
    function getTokenInfo(string memory symbol) external view returns (TokenInfo memory) {
        return supportedTokens[symbol];
    }

    /**
     * @dev Check if transfer has been processed
     * @param intentId The intent ID
     * @return True if processed
     */
    function isTransferProcessed(bytes32 intentId) external view returns (bool) {
        return processedTransfers[intentId];
    }

    /**
     * @dev Emergency function to recover tokens
     * @param tokenSymbol The token symbol
     * @param amount The amount to recover
     */
    function emergencyRecoverTokens(string memory tokenSymbol, uint256 amount) external onlyOwner {
        TokenInfo memory tokenInfo = supportedTokens[tokenSymbol];
        IERC20(tokenInfo.tokenAddress).safeTransfer(owner(), amount);
    }
}
