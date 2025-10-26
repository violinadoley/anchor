// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title UnifiedLiquidityPool
 * @dev Manages liquidity across multiple tokens and chains for unmatched intents
 * Acts as a counterparty when users' intents cannot be matched peer-to-peer
 */
contract UnifiedLiquidityPool is Ownable, ReentrancyGuard {
    
    struct TokenInfo {
        address tokenAddress;
        uint256 balance;
        bool isActive;
    }
    
    struct SettlementRequest {
        bytes32 requestId;
        address user;
        address fromToken;
        address toToken;
        uint256 fromAmount;
        uint256 toAmount;
        uint256 timestamp;
        bool isFulfilled;
    }
    
    // Token info mapping: tokenSymbol => TokenInfo
    mapping(string => TokenInfo) public tokenInfo;
    
    // Settlement requests: requestId => SettlementRequest
    mapping(bytes32 => SettlementRequest) public settlementRequests;
    
    // User liquidity deposits: user => tokenSymbol => amount
    mapping(address => mapping(string => uint256)) public userLiquidity;
    
    // Total liquidity: tokenSymbol => total amount
    mapping(string => uint256) public totalLiquidity;
    
    // Events
    event LiquidityDeposited(address indexed user, string indexed tokenSymbol, uint256 amount);
    event LiquidityWithdrawn(address indexed user, string indexed tokenSymbol, uint256 amount);
    event SettlementFulfilled(bytes32 indexed requestId, address indexed user, uint256 fromAmount, uint256 toAmount);
    event PoolReplenished(string indexed tokenSymbol, uint256 amount);
    
    // Supported tokens
    string[] public supportedTokens;
    
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize supported tokens
        supportedTokens.push("ETH");
        supportedTokens.push("USDC");
        supportedTokens.push("USDT");
    }
    
    /**
     * @dev Deposit liquidity into the pool for a specific token
     * @param tokenSymbol The symbol of the token (e.g., "USDC", "ETH")
     * @param amount The amount to deposit
     */
    function depositLiquidity(string memory tokenSymbol, uint256 amount) 
        external 
        payable 
        nonReentrant 
    {
        require(bytes(tokenSymbol).length > 0, "Invalid token symbol");
        require(amount > 0, "Amount must be greater than 0");
        
        if (keccak256(bytes(tokenSymbol)) == keccak256(bytes("ETH"))) {
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            IERC20 token = IERC20(tokenInfo[tokenSymbol].tokenAddress);
            require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
            require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        }
        
        // Update balances
        userLiquidity[msg.sender][tokenSymbol] += amount;
        totalLiquidity[tokenSymbol] += amount;
        tokenInfo[tokenSymbol].balance += amount;
        
        emit LiquidityDeposited(msg.sender, tokenSymbol, amount);
    }
    
    /**
     * @dev Withdraw liquidity from the pool
     * @param tokenSymbol The symbol of the token
     * @param amount The amount to withdraw
     */
    function withdrawLiquidity(string memory tokenSymbol, uint256 amount) 
        external 
        nonReentrant 
    {
        require(userLiquidity[msg.sender][tokenSymbol] >= amount, "Insufficient liquidity");
        require(tokenInfo[tokenSymbol].balance >= amount, "Pool insufficient balance");
        
        // Update balances
        userLiquidity[msg.sender][tokenSymbol] -= amount;
        totalLiquidity[tokenSymbol] -= amount;
        tokenInfo[tokenSymbol].balance -= amount;
        
        // Transfer tokens
        if (keccak256(bytes(tokenSymbol)) == keccak256(bytes("ETH"))) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20 token = IERC20(tokenInfo[tokenSymbol].tokenAddress);
            require(token.transfer(msg.sender, amount), "Token transfer failed");
        }
        
        emit LiquidityWithdrawn(msg.sender, tokenSymbol, amount);
    }
    
    /**
     * @dev Fulfill an unmatched intent using pool liquidity
     * @param requestId Unique identifier for the settlement request
     * @param user The user who submitted the intent
     * @param fromToken The token being sold
     * @param toToken The token being bought
     * @param fromAmount The amount of fromToken
     * @param toAmount The amount of toToken to give to user
     */
    function fulfillSettlement(
        bytes32 requestId,
        address user,
        string memory fromToken,
        string memory toToken,
        uint256 fromAmount,
        uint256 toAmount
    ) external onlyOwner nonReentrant {
        require(!settlementRequests[requestId].isFulfilled, "Already fulfilled");
        require(tokenInfo[toToken].balance >= toAmount, "Insufficient pool liquidity");
        
        // Create settlement request
        settlementRequests[requestId] = SettlementRequest({
            requestId: requestId,
            user: user,
            fromToken: keccak256(bytes(fromToken)) == keccak256(bytes("ETH")) ? address(0) : tokenInfo[fromToken].tokenAddress,
            toToken: keccak256(bytes(toToken)) == keccak256(bytes("ETH")) ? address(0) : tokenInfo[toToken].tokenAddress,
            fromAmount: fromAmount,
            toAmount: toAmount,
            timestamp: block.timestamp,
            isFulfilled: true
        });
        
        // Update pool balance
        tokenInfo[toToken].balance -= toAmount;
        totalLiquidity[toToken] -= toAmount;
        
        // Transfer tokens to user
        if (keccak256(bytes(toToken)) == keccak256(bytes("ETH"))) {
            (bool success, ) = user.call{value: toAmount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20 token = IERC20(tokenInfo[toToken].tokenAddress);
            require(token.transfer(user, toAmount), "Token transfer failed");
        }
        
        // Update pool balance for received token (if not ETH)
        if (keccak256(bytes(fromToken)) != keccak256(bytes("ETH"))) {
            tokenInfo[fromToken].balance += fromAmount;
            totalLiquidity[fromToken] += fromAmount;
        } else {
            // ETH received, update balance
            tokenInfo[fromToken].balance += fromAmount;
            totalLiquidity[fromToken] += fromAmount;
        }
        
        emit SettlementFulfilled(requestId, user, fromAmount, toAmount);
    }
    
    /**
     * @dev Add or update a token in the pool
     * @param tokenSymbol The symbol of the token
     * @param tokenAddress The address of the token contract
     */
    function addToken(string memory tokenSymbol, address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        
        if (!tokenInfo[tokenSymbol].isActive) {
            supportedTokens.push(tokenSymbol);
        }
        
        tokenInfo[tokenSymbol] = TokenInfo({
            tokenAddress: tokenAddress,
            balance: 0,
            isActive: true
        });
    }
    
    /**
     * @dev Get pool balance for a specific token
     * @param tokenSymbol The symbol of the token
     * @return The balance
     */
    function getPoolBalance(string memory tokenSymbol) external view returns (uint256) {
        return tokenInfo[tokenSymbol].balance;
    }
    
    /**
     * @dev Get user's liquidity for a specific token
     * @param user The user address
     * @param tokenSymbol The symbol of the token
     * @return The liquidity amount
     */
    function getUserLiquidity(address user, string memory tokenSymbol) 
        external 
        view 
        returns (uint256) 
    {
        return userLiquidity[user][tokenSymbol];
    }
    
    // Allow contract to receive ETH
    receive() external payable {
        tokenInfo["ETH"].balance += msg.value;
        totalLiquidity["ETH"] += msg.value;
    }
}
