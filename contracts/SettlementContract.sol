// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SettlementContract
 * @dev Handles batch settlement of cross-chain swap intents
 * @notice This contract processes batched swaps with Merkle proofs and Pyth price verification
 */
contract SettlementContract is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events
    event BatchSettled(
        bytes32 indexed batchId,
        bytes32 indexed merkleRoot,
        uint256 totalIntents,
        uint256 timestamp
    );

    event IntentClaimed(
        bytes32 indexed intentId,
        address indexed user,
        address indexed recipient,
        string fromToken,
        string toToken,
        uint256 amount,
        bytes32 batchId
    );

    event PriceUpdated(
        string token,
        uint256 price,
        uint256 timestamp
    );

    // Structs
    struct SwapIntent {
        bytes32 intentId;
        address userAddress;
        string fromToken;
        string toToken;
        string fromChain;
        string toChain;
        uint256 amount;
        address recipient;
        uint256 netAmount;
        bytes32 matchedWith;
    }

    struct BatchData {
        bytes32 batchId;
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 totalIntents;
        bool isSettled;
        string priceDataHash;
    }

    struct MerkleProof {
        bytes32 leaf;
        bytes32[] path;
        uint256[] indices;
    }

    // State variables
    mapping(bytes32 => BatchData) public batches;
    mapping(bytes32 => bool) public claimedIntents;
    mapping(string => uint256) public tokenPrices;
    mapping(string => uint256) public lastPriceUpdate;

    // Constants
    uint256 public constant PRICE_VALIDITY_PERIOD = 1 hours;
    uint256 public constant MINIMUM_SETTLEMENT_DELAY = 5 minutes;

    // Modifiers
    modifier onlyValidBatch(bytes32 batchId) {
        require(batches[batchId].batchId != bytes32(0), "Batch does not exist");
        require(!batches[batchId].isSettled, "Batch already settled");
        _;
    }

    modifier onlyValidPrice(string memory token) {
        require(tokenPrices[token] > 0, "Price not available");
        require(
            block.timestamp - lastPriceUpdate[token] <= PRICE_VALIDITY_PERIOD,
            "Price expired"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Settle a batch of swap intents
     * @param batchData The batch data containing merkle root and metadata
     * @param priceData Array of token prices used for settlement
     */
    function settleBatch(
        BatchData memory batchData,
        string[] memory tokens,
        uint256[] memory prices
    ) external onlyOwner nonReentrant {
        require(batchData.batchId != bytes32(0), "Invalid batch ID");
        require(batchData.merkleRoot != bytes32(0), "Invalid merkle root");
        require(tokens.length == prices.length, "Price data mismatch");

        // Update prices
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenPrices[tokens[i]] = prices[i];
            lastPriceUpdate[tokens[i]] = block.timestamp;
            emit PriceUpdated(tokens[i], prices[i], block.timestamp);
        }

        // Store batch data
        batches[batchData.batchId] = batchData;

        emit BatchSettled(
            batchData.batchId,
            batchData.merkleRoot,
            batchData.totalIntents,
            block.timestamp
        );
    }

    /**
     * @dev Claim tokens for a settled intent using Merkle proof
     * @param intent The swap intent data
     * @param proof The Merkle proof for the intent
     * @param batchId The batch ID containing this intent
     */
    function claimIntent(
        SwapIntent memory intent,
        MerkleProof memory proof,
        bytes32 batchId
    ) external nonReentrant {
        require(batches[batchId].isSettled, "Batch not settled");
        require(!claimedIntents[intent.intentId], "Intent already claimed");
        require(
            intent.recipient == msg.sender || intent.userAddress == msg.sender,
            "Not authorized to claim"
        );

        // Verify Merkle proof
        require(
            verifyMerkleProof(intent, proof, batchId),
            "Invalid Merkle proof"
        );

        // Mark intent as claimed
        claimedIntents[intent.intentId] = true;

        // Emit claim event
        emit IntentClaimed(
            intent.intentId,
            intent.userAddress,
            intent.recipient,
            intent.fromToken,
            intent.toToken,
            intent.netAmount,
            batchId
        );

        // Note: Actual token transfer would be handled by a separate token manager contract
        // This contract focuses on settlement verification and Merkle proof validation
    }

    /**
     * @dev Verify Merkle proof for an intent
     * @param intent The swap intent data
     * @param proof The Merkle proof
     * @param batchId The batch ID
     * @return True if proof is valid
     */
    function verifyMerkleProof(
        SwapIntent memory intent,
        MerkleProof memory proof,
        bytes32 batchId
    ) public view returns (bool) {
        bytes32 merkleRoot = batches[batchId].merkleRoot;
        
        // Recreate the leaf hash
        bytes32 leaf = keccak256(abi.encodePacked(
            intent.intentId,
            intent.userAddress,
            intent.fromToken,
            intent.toToken,
            intent.fromChain,
            intent.toChain,
            intent.amount,
            intent.recipient,
            intent.netAmount,
            intent.matchedWith
        ));

        require(leaf == proof.leaf, "Leaf hash mismatch");

        // Verify Merkle proof
        bytes32 currentHash = proof.leaf;
        for (uint256 i = 0; i < proof.path.length; i++) {
            if (proof.indices[i] == 0) {
                currentHash = keccak256(abi.encodePacked(currentHash, proof.path[i]));
            } else {
                currentHash = keccak256(abi.encodePacked(proof.path[i], currentHash));
            }
        }

        return currentHash == merkleRoot;
    }

    /**
     * @dev Get batch information
     * @param batchId The batch ID
     * @return BatchData The batch data
     */
    function getBatch(bytes32 batchId) external view returns (BatchData memory) {
        return batches[batchId];
    }

    /**
     * @dev Check if an intent has been claimed
     * @param intentId The intent ID
     * @return True if claimed
     */
    function isIntentClaimed(bytes32 intentId) external view returns (bool) {
        return claimedIntents[intentId];
    }

    /**
     * @dev Get current price for a token
     * @param token The token symbol
     * @return The current price
     */
    function getTokenPrice(string memory token) external view returns (uint256) {
        return tokenPrices[token];
    }

    /**
     * @dev Check if price is valid (not expired)
     * @param token The token symbol
     * @return True if price is valid
     */
    function isPriceValid(string memory token) external view returns (bool) {
        return tokenPrices[token] > 0 && 
               block.timestamp - lastPriceUpdate[token] <= PRICE_VALIDITY_PERIOD;
    }

    /**
     * @dev Emergency function to mark batch as settled (for testing)
     * @param batchId The batch ID
     */
    function emergencySettleBatch(bytes32 batchId) external onlyOwner {
        require(batches[batchId].batchId != bytes32(0), "Batch does not exist");
        batches[batchId].isSettled = true;
    }

    /**
     * @dev Update price for a token (for testing)
     * @param token The token symbol
     * @param price The new price
     */
    function updatePrice(string memory token, uint256 price) external onlyOwner {
        tokenPrices[token] = price;
        lastPriceUpdate[token] = block.timestamp;
        emit PriceUpdated(token, price, block.timestamp);
    }
}
