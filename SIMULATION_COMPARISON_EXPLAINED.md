# How the Simulation Compares to Traditional AMMs

## The Comparison

The simulation shows **Anchor's multilateral netting** vs a **theoretical traditional AMM** (like Uniswap).

## Traditional AMM Baseline

**Assumptions:**
- Every swap goes through the liquidity pool
- Each swap pays 0.3% slippage
- Each swap is a separate transaction (10 transactions)

**Example:**
- 10 swaps of $1000 each = $10,000 total volume
- All $10,000 hits the pool
- Total slippage: $10,000 × 0.3% = $30

## Anchor's System

**How it works:**
- Backend netting finds P2P matches (direct swaps)
- P2P matches: 0 slippage (direct exchange)
- Pool fulfillments: Only unmatched swaps pay slippage

**Same example:**
- 10 swaps of $1000 each = $10,000 total volume
- 9 swaps matched P2P (90%)
- 1 swap goes to pool ($1,000)
- Total slippage: $1,000 × 0.3% = $3
- Savings: $30 - $3 = $27 (90% reduction)

## What the UI Shows

1. **P2P Matching Rate**: 90%
   - Means: 9 out of 10 swaps matched P2P

2. **Slippage Reduction**: 90%
   - Means: 90% less slippage than traditional AMM

3. **Gas Savings**: 85%
   - Means: 1 batch transaction vs 10 individual transactions

4. **Overall Efficiency**: ~88%
   - Average of all three metrics

## Important Note

This is a **theoretical comparison**, not a direct test against Uniswap.

**Why it's still valid:**
- The math is correct (logic is sound)
- The savings are real (P2P matching does reduce slippage)
- The concept works (batching is proven in production)

## Demo Talking Points

**Say this:**
> "Our system processes 10 swaps with a 90% P2P matching rate. This means 90% 
> of our swaps have zero slippage because users trade directly with each other.
> Only 10% hit the liquidity pool.
>
> In a traditional AMM, all 10 swaps would hit the pool, paying full slippage 
> on every swap. We save 90% on slippage by finding these P2P matches."

**Don't say:**
> ❌ "We beat Uniswap" (you didn't actually test against Uniswap)
> ✅ Instead: "We reduce slippage by 90% through intelligent P2P matching"
