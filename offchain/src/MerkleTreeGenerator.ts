import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { MatchedSwap, MerkleProof } from './types';

export class MerkleTreeGenerator {
  /**
   * Generate Merkle tree and proofs for a batch of matched swaps
   */
  public generateMerkleTree(matchedSwaps: MatchedSwap[]): {
    tree: MerkleTree;
    root: string;
    proofs: Record<string, MerkleProof>;
  } {
    console.log(`Generating Merkle tree for ${matchedSwaps.length} swaps`);
    
    // Create leaves from matched swaps
    const leaves = matchedSwaps.map(swap => this.createLeaf(swap));
    
    // Generate Merkle tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    // Generate proofs for each swap
    const proofs: Record<string, MerkleProof> = {};
    
    for (let i = 0; i < matchedSwaps.length; i++) {
      const swap = matchedSwaps[i];
      const leaf = leaves[i];
      const proof = tree.getHexProof(leaf);
      const indices = tree.getProofIndices([i], tree.getDepth());
      
      proofs[swap.intentId] = {
        leaf: leaf.toString('hex'),
        path: proof,
        indices: indices
      };
    }
    
    console.log(`Merkle tree generated with root: ${root}`);
    return { tree, root, proofs };
  }
  
  /**
   * Create a leaf hash from a matched swap
   */
  private createLeaf(swap: MatchedSwap): Buffer {
    const leafData = {
      intentId: swap.intentId,
      userAddress: swap.userAddress,
      fromToken: swap.fromToken,
      toToken: swap.toToken,
      fromChain: swap.fromChain,
      toChain: swap.toChain,
      amount: swap.amount,
      recipient: swap.recipient,
      netAmount: swap.netAmount,
      matchedWith: swap.matchedWith
    };
    
    const leafString = JSON.stringify(leafData, Object.keys(leafData).sort());
    return keccak256(leafString);
  }
  
  /**
   * Verify a Merkle proof
   */
  public verifyProof(proof: MerkleProof, root: string, leaf: string): boolean {
    try {
      const leafBuffer = Buffer.from(leaf, 'hex');
      const proofBuffers = proof.path.map(p => Buffer.from(p, 'hex'));
      
      const tree = new MerkleTree([leafBuffer], keccak256, { sortPairs: true });
      return tree.verify(proofBuffers, leafBuffer, root);
    } catch (error) {
      console.error('Error verifying Merkle proof:', error);
      return false;
    }
  }
  
  /**
   * Generate a summary hash for the entire batch
   */
  public generateBatchHash(batchData: any): string {
    const batchString = JSON.stringify(batchData, Object.keys(batchData).sort());
    return keccak256(batchString).toString('hex');
  }
}
