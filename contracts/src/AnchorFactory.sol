// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SettlementContract.sol";
import "./TokenManager.sol";
import "./PythOracle.sol";

/**
 * @title AnchorFactory
 * @dev Factory contract for deploying and managing Anchor Protocol contracts
 * @notice This contract handles the deployment and configuration of all protocol contracts
 */
contract AnchorFactory is Ownable, ReentrancyGuard {
    // Events
    event ContractDeployed(
        string indexed contractType,
        address indexed contractAddress,
        uint256 timestamp
    );

    event ContractConfigured(
        address indexed contractAddress,
        string indexed configuration,
        uint256 timestamp
    );

    // Structs
    struct ProtocolConfig {
        address settlementContract;
        address tokenManager;
        address pythOracle;
        bool isActive;
        uint256 deployedAt;
    }

    struct TokenConfig {
        string symbol;
        address tokenAddress;
        uint8 decimals;
        bool isActive;
    }

    // State variables
    mapping(address => ProtocolConfig) public deployedProtocols;
    mapping(string => TokenConfig) public supportedTokens;
    address[] public deployedSettlementContracts;
    address[] public deployedTokenManagers;
    address[] public deployedPythOracles;

    // Modifiers
    modifier onlyActiveProtocol(address protocolAddress) {
        require(deployedProtocols[protocolAddress].isActive, "Protocol not active");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Initialize with default token configurations
        _initializeDefaultTokens();
    }

    /**
     * @dev Initialize default token configurations
     */
    function _initializeDefaultTokens() internal {
        // Add default token configurations
        supportedTokens["USDC"] = TokenConfig({
            symbol: "USDC",
            tokenAddress: address(0), // Will be set during deployment
            decimals: 6,
            isActive: true
        });

        supportedTokens["USDT"] = TokenConfig({
            symbol: "USDT",
            tokenAddress: address(0), // Will be set during deployment
            decimals: 6,
            isActive: true
        });

        supportedTokens["ETH"] = TokenConfig({
            symbol: "ETH",
            tokenAddress: address(0), // Will be set during deployment
            decimals: 18,
            isActive: true
        });

        supportedTokens["BTC"] = TokenConfig({
            symbol: "BTC",
            tokenAddress: address(0), // Will be set during deployment
            decimals: 8,
            isActive: true
        });
    }

    /**
     * @dev Deploy a complete Anchor Protocol instance
     * @return protocolConfig The deployed protocol configuration
     */
    function deployProtocol() external onlyOwner nonReentrant returns (ProtocolConfig memory) {
        // Deploy Pyth Oracle
        PythOracle pythOracle = new PythOracle();
        deployedPythOracles.push(address(pythOracle));

        // Deploy Settlement Contract
        SettlementContract settlementContract = new SettlementContract();
        deployedSettlementContracts.push(address(settlementContract));

        // Deploy Token Manager
        TokenManager tokenManager = new TokenManager(address(settlementContract));
        deployedTokenManagers.push(address(tokenManager));

        // Create protocol configuration
        ProtocolConfig memory protocolConfig = ProtocolConfig({
            settlementContract: address(settlementContract),
            tokenManager: address(tokenManager),
            pythOracle: address(pythOracle),
            isActive: true,
            deployedAt: block.timestamp
        });

        // Store protocol configuration
        deployedProtocols[address(settlementContract)] = protocolConfig;

        // Emit events
        emit ContractDeployed("PythOracle", address(pythOracle), block.timestamp);
        emit ContractDeployed("SettlementContract", address(settlementContract), block.timestamp);
        emit ContractDeployed("TokenManager", address(tokenManager), block.timestamp);

        return protocolConfig;
    }

    /**
     * @dev Configure a deployed protocol
     * @param protocolAddress The protocol address
     * @param tokenAddresses Array of token addresses
     */
    function configureProtocol(
        address protocolAddress,
        address[] memory tokenAddresses,
        string[] memory tokenSymbols
    ) external onlyOwner onlyActiveProtocol(protocolAddress) {
        require(tokenAddresses.length == tokenSymbols.length, "Array length mismatch");

        ProtocolConfig memory config = deployedProtocols[protocolAddress];
        
        // Configure Token Manager
        TokenManager tokenManager = TokenManager(config.tokenManager);
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            TokenConfig memory tokenConfig = supportedTokens[tokenSymbols[i]];
            require(tokenConfig.isActive, "Token not supported");
            
            tokenManager.addSupportedToken(
                tokenSymbols[i],
                tokenAddresses[i],
                tokenConfig.decimals
            );
        }

        emit ContractConfigured(protocolAddress, "TokenConfiguration", block.timestamp);
    }

    /**
     * @dev Add a new supported token
     * @param symbol The token symbol
     * @param tokenAddress The token contract address
     * @param decimals The token decimals
     */
    function addSupportedToken(
        string memory symbol,
        address tokenAddress,
        uint8 decimals
    ) external onlyOwner {
        supportedTokens[symbol] = TokenConfig({
            symbol: symbol,
            tokenAddress: tokenAddress,
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
     * @dev Get protocol configuration
     * @param protocolAddress The protocol address
     * @return The protocol configuration
     */
    function getProtocolConfig(address protocolAddress) external view returns (ProtocolConfig memory) {
        return deployedProtocols[protocolAddress];
    }

    /**
     * @dev Get token configuration
     * @param symbol The token symbol
     * @return The token configuration
     */
    function getTokenConfig(string memory symbol) external view returns (TokenConfig memory) {
        return supportedTokens[symbol];
    }

    /**
     * @dev Get all deployed settlement contracts
     * @return Array of settlement contract addresses
     */
    function getDeployedSettlementContracts() external view returns (address[] memory) {
        return deployedSettlementContracts;
    }

    /**
     * @dev Get all deployed token managers
     * @return Array of token manager addresses
     */
    function getDeployedTokenManagers() external view returns (address[] memory) {
        return deployedTokenManagers;
    }

    /**
     * @dev Get all deployed Pyth oracles
     * @return Array of Pyth oracle addresses
     */
    function getDeployedPythOracles() external view returns (address[] memory) {
        return deployedPythOracles;
    }

    /**
     * @dev Deactivate a protocol
     * @param protocolAddress The protocol address
     */
    function deactivateProtocol(address protocolAddress) external onlyOwner {
        require(deployedProtocols[protocolAddress].isActive, "Protocol already inactive");
        deployedProtocols[protocolAddress].isActive = false;
    }

    /**
     * @dev Reactivate a protocol
     * @param protocolAddress The protocol address
     */
    function reactivateProtocol(address protocolAddress) external onlyOwner {
        require(!deployedProtocols[protocolAddress].isActive, "Protocol already active");
        deployedProtocols[protocolAddress].isActive = true;
    }

    /**
     * @dev Get protocol statistics
     * @return totalSettlementContracts Total number of deployed settlement contracts
     * @return totalTokenManagers Total number of deployed token managers
     * @return totalPythOracles Total number of deployed Pyth oracles
     * @return activeProtocols Number of active protocols
     * @return supportedTokensCount Number of supported tokens
     */
    function getProtocolStatistics() external view returns (
        uint256 totalSettlementContracts,
        uint256 totalTokenManagers,
        uint256 totalPythOracles,
        uint256 activeProtocols,
        uint256 supportedTokensCount
    ) {
        totalSettlementContracts = deployedSettlementContracts.length;
        totalTokenManagers = deployedTokenManagers.length;
        totalPythOracles = deployedPythOracles.length;
        
        // Count active protocols
        for (uint256 i = 0; i < deployedSettlementContracts.length; i++) {
            if (deployedProtocols[deployedSettlementContracts[i]].isActive) {
                activeProtocols++;
            }
        }
        
        // Count supported tokens
        string[] memory tokenSymbols = new string[](4);
        tokenSymbols[0] = "USDC";
        tokenSymbols[1] = "USDT";
        tokenSymbols[2] = "ETH";
        tokenSymbols[3] = "BTC";
        
        for (uint256 i = 0; i < tokenSymbols.length; i++) {
            if (supportedTokens[tokenSymbols[i]].isActive) {
                supportedTokensCount++;
            }
        }
    }
}
