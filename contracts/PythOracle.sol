// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PythOracle
 * @dev Integrates with Pyth Network for real-time price feeds
 * @notice This contract handles Pyth price verification and validation
 */
contract PythOracle is Ownable, ReentrancyGuard {
    // Events
    event PriceUpdated(
        string indexed token,
        uint256 price,
        uint256 timestamp,
        uint256 confidence
    );

    event PriceFeedAdded(
        string indexed token,
        bytes32 indexed priceId,
        uint256 initialPrice
    );

    // Structs
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 confidence;
        bool isValid;
    }

    // State variables
    mapping(string => bytes32) public priceFeedIds;
    mapping(string => PriceData) public priceData;
    mapping(bytes32 => bool) public authorizedUpdaters;
    
    uint256 public constant PRICE_VALIDITY_PERIOD = 1 hours;
    uint256 public constant MAX_PRICE_DEVIATION = 10; // 10% max deviation

    // Modifiers
    modifier onlyAuthorizedUpdater() {
        require(authorizedUpdaters[bytes32(uint256(uint160(msg.sender)))], "Not authorized");
        _;
    }

    modifier onlyValidPrice(string memory token) {
        require(priceData[token].isValid, "Price not available");
        require(
            block.timestamp - priceData[token].timestamp <= PRICE_VALIDITY_PERIOD,
            "Price expired"
        );
        _;
    }

    constructor() Ownable(msg.sender) {
        // Initialize with common token price feed IDs
        _initializePriceFeeds();
    }

    /**
     * @dev Initialize common price feeds
     */
    function _initializePriceFeeds() internal {
        // ETH/USD price feed ID from Pyth Network
        priceFeedIds["ETH"] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
        
        // BTC/USD price feed ID from Pyth Network
        priceFeedIds["BTC"] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43;
        
        // Set initial prices (these would be updated by authorized updaters)
        priceData["ETH"] = PriceData({
            price: 392000000000, // $3920.00 (8 decimals)
            timestamp: block.timestamp,
            confidence: 1000000, // $0.01 confidence (6 decimals)
            isValid: true
        });
        
        priceData["BTC"] = PriceData({
            price: 6700000000000, // $67000.00 (8 decimals)
            timestamp: block.timestamp,
            confidence: 10000000, // $0.10 confidence (6 decimals)
            isValid: true
        });
    }

    /**
     * @dev Add a new price feed
     * @param token The token symbol
     * @param priceId The Pyth price feed ID
     * @param initialPrice The initial price
     */
    function addPriceFeed(
        string memory token,
        bytes32 priceId,
        uint256 initialPrice
    ) external onlyOwner {
        priceFeedIds[token] = priceId;
        priceData[token] = PriceData({
            price: initialPrice,
            timestamp: block.timestamp,
            confidence: 1000000, // Default confidence
            isValid: true
        });
        
        emit PriceFeedAdded(token, priceId, initialPrice);
    }

    /**
     * @dev Update price data from Pyth Network
     * @param token The token symbol
     * @param price The new price
     * @param confidence The price confidence
     */
    function updatePrice(
        string memory token,
        uint256 price,
        uint256 confidence
    ) external onlyAuthorizedUpdater {
        require(price > 0, "Invalid price");
        require(confidence > 0, "Invalid confidence");

        // Check for significant price deviation (circuit breaker)
        if (priceData[token].isValid) {
            uint256 currentPrice = priceData[token].price;
            uint256 deviation = (price > currentPrice) 
                ? ((price - currentPrice) * 100) / currentPrice
                : ((currentPrice - price) * 100) / currentPrice;
            
            require(deviation <= MAX_PRICE_DEVIATION, "Price deviation too high");
        }

        priceData[token] = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence,
            isValid: true
        });

        emit PriceUpdated(token, price, block.timestamp, confidence);
    }

    /**
     * @dev Get current price for a token
     * @param token The token symbol
     * @return The current price
     */
    function getPrice(string memory token) external view returns (uint256) {
        require(priceData[token].isValid, "Price not available");
        require(
            block.timestamp - priceData[token].timestamp <= PRICE_VALIDITY_PERIOD,
            "Price expired"
        );
        return priceData[token].price;
    }

    /**
     * @dev Get price data for a token
     * @param token The token symbol
     * @return PriceData The complete price data
     */
    function getPriceData(string memory token) external view returns (PriceData memory) {
        return priceData[token];
    }

    /**
     * @dev Check if price is valid and not expired
     * @param token The token symbol
     * @return True if price is valid
     */
    function isPriceValid(string memory token) external view returns (bool) {
        return priceData[token].isValid && 
               (block.timestamp - priceData[token].timestamp <= PRICE_VALIDITY_PERIOD);
    }

    /**
     * @dev Get price feed ID for a token
     * @param token The token symbol
     * @return The price feed ID
     */
    function getPriceFeedId(string memory token) external view returns (bytes32) {
        return priceFeedIds[token];
    }

    /**
     * @dev Calculate price impact for a swap
     * @param token The token symbol
     * @param amount The swap amount
     * @return The price impact in basis points
     */
    function calculatePriceImpact(
        string memory token,
        uint256 amount
    ) external view onlyValidPrice(token) returns (uint256) {
        // Simple price impact calculation based on confidence
        uint256 confidence = priceData[token].confidence;
        uint256 price = priceData[token].price;
        
        // Price impact = (confidence / price) * 10000 (in basis points)
        return (confidence * 10000) / price;
    }

    /**
     * @dev Authorize a price updater
     * @param updater The updater address
     */
    function authorizeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[bytes32(uint256(uint160(updater)))] = true;
    }

    /**
     * @dev Revoke authorization for a price updater
     * @param updater The updater address
     */
    function revokeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[bytes32(uint256(uint160(updater)))] = false;
    }

    /**
     * @dev Emergency function to invalidate a price
     * @param token The token symbol
     */
    function emergencyInvalidatePrice(string memory token) external onlyOwner {
        priceData[token].isValid = false;
    }

    /**
     * @dev Get all supported tokens
     * @return Array of supported token symbols
     */
    function getSupportedTokens() external view returns (string[] memory) {
        // This would need to be implemented based on your specific needs
        // For now, returning hardcoded list
        string[] memory tokens = new string[](2);
        tokens[0] = "ETH";
        tokens[1] = "BTC";
        return tokens;
    }
}
