// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./SettlementContract.sol";
import "./TokenManager.sol";
import "./PythOracle.sol";
import "./UnifiedLiquidityPool.sol";

/**
 * @title SimpleAnchorFactory
 * @dev Simplified factory contract for deploying Anchor Protocol contracts
 */
contract SimpleAnchorFactory is Ownable, ReentrancyGuard {
    // Events
    event ProtocolDeployed(
        address indexed settlementContract,
        address indexed tokenManager,
        address indexed pythOracle,
        address liquidityPool,
        uint256 timestamp
    );

    // State variables
    mapping(address => bool) public deployedProtocols;
    address[] public allProtocols;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deploy a complete Anchor Protocol instance
     * @return settlementContract The deployed settlement contract address
     * @return tokenManager The deployed token manager address
     * @return pythOracle The deployed Pyth oracle address
     */
    function deployProtocol() external onlyOwner nonReentrant returns (
        address settlementContract,
        address tokenManager,
        address pythOracle,
        address liquidityPool
    ) {
        // Deploy Pyth Oracle
        PythOracle pythOracleContract = new PythOracle();
        pythOracle = address(pythOracleContract);

        // Deploy Settlement Contract
        SettlementContract settlementContractInstance = new SettlementContract();
        settlementContract = address(settlementContractInstance);

        // Deploy Token Manager
        TokenManager tokenManagerContract = new TokenManager(settlementContract);
        tokenManager = address(tokenManagerContract);

        // Deploy Unified Liquidity Pool
        UnifiedLiquidityPool liquidityPoolContract = new UnifiedLiquidityPool(msg.sender);
        liquidityPool = address(liquidityPoolContract);

        // Store protocol
        deployedProtocols[settlementContract] = true;
        allProtocols.push(settlementContract);

        emit ProtocolDeployed(settlementContract, tokenManager, pythOracle, liquidityPool, block.timestamp);

        return (settlementContract, tokenManager, pythOracle, liquidityPool);
    }

    /**
     * @dev Get all deployed protocols
     * @return Array of protocol addresses
     */
    function getAllProtocols() external view returns (address[] memory) {
        return allProtocols;
    }

    /**
     * @dev Check if a protocol is deployed
     * @param protocolAddress The protocol address to check
     * @return True if protocol is deployed
     */
    function isProtocolDeployed(address protocolAddress) external view returns (bool) {
        return deployedProtocols[protocolAddress];
    }

    /**
     * @dev Get protocol count
     * @return Number of deployed protocols
     */
    function getProtocolCount() external view returns (uint256) {
        return allProtocols.length;
    }
}
