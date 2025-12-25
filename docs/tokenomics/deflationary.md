# Deflationary Model

## How 8BIT Supply Decreases Over Time

Unlike inflationary tokens that constantly increase supply, 8BIT uses a **direct burn mechanism** to permanently remove tokens from circulation.

## The Burn Mechanism

### How It Works

```
1. Player pays 2,000 8BIT to enter Standard Weekly tournament
   ↓
2. Tournament contract receives 2,000 8BIT
   ↓
3. Smart contract automatically splits payment:
   • 50% (1,000 8BIT) → Prize pool for winners
   • 50% (1,000 8BIT) → Burn address
   ↓
4. Burned tokens sent to 0x000...dEaD address
   ↓
5. Tokens permanently removed from circulation ♨️
```

### Key Features

✅ **Automatic** - No manual intervention
✅ **Trustless** - Smart contract enforced
✅ **Transparent** - All burns visible on blockchain
✅ **Irreversible** - Tokens can never be recovered
✅ **Continuous** - Every tournament contributes

## Tournament Entry Fees (Current)

| Tournament Type | Entry Fee (8BIT) | Burned per Entry | Prize Pool |
|----------------|------------------|------------------|------------|
| Standard Weekly | 2,000 | 1,000 | 50,000 |
| Standard Monthly | 10,000 | 5,000 | 100,000 |
| High Roller Weekly | 10,000 | 5,000 | 150,000 |
| High Roller Monthly | 50,000 | 25,000 | 500,000 |

## Burn Address

**Official Burn Wallet:** `0x000000000000000000000000000000000000dEaD`

- Tokens sent here are **permanently destroyed**
- No private key exists (wallet is inaccessible)
- Reduces circulating supply forever
- Publicly viewable on [Arbiscan](https://arbiscan.io)

## Impact on Circulating Supply

### Monthly Burn Examples

#### Conservative Scenario (1,000 Tournament Entries/Month)

| Metric | Value |
|--------|-------|
| Tournament entries | 1,000 |
| Average entry fee | 10,000 8BIT |
| Total fees collected | 10M 8BIT |
| **Tokens burned (50%)** | **5M 8BIT** |
| **% of supply burned** | **1%/month** |
| **Annual burn rate** | **12% of supply** |

**Effect:** Net DEFLATIONARY (12% burn vs 6% emissions = -6% supply annually)

---

#### Moderate Scenario (5,000 Tournament Entries/Month)

| Metric | Value |
|--------|-------|
| Tournament entries | 5,000 |
| Average entry fee | 10,000 8BIT |
| Total fees collected | 50M 8BIT |
| **Tokens burned (50%)** | **25M 8BIT** |
| **% of supply burned** | **5%/month** |
| **Annual burn rate** | **60% of supply** |

**Effect:** HEAVY deflation (60% burn vs 6% emissions = -54% supply annually)

---

#### Growth Scenario (10,000 Tournament Entries/Month)

| Metric | Value |
|--------|-------|
| Tournament entries | 10,000 |
| Average entry fee | 10,000 8BIT |
| Total fees collected | 100M 8BIT |
| **Tokens burned (50%)** | **50M 8BIT** |
| **% of supply burned** | **10%/month** |
| **Annual burn rate** | **120% of supply** |

**Effect:** EXTREME deflation (120% burn vs 6% emissions = -114% supply annually)

## Deflationary Timeline

### Years 1-5 (Emissions Active)

**Net Supply Change** = Emissions - Burns

| Tournament Activity | Emissions | Burns | Net Change |
|---------------------|-----------|-------|------------|
| 1,000 entries/month | +2.5M | -5M | **-2.5M** (deflationary!) |
| 5,000 entries/month | +2.5M | -25M | **-22.5M** (heavy deflation) |
| 10,000 entries/month | +2.5M | -50M | **-47.5M** (extreme deflation) |

**Key Insight:** Even at low tournament volume (~500 entries/month), the token becomes **net deflationary** during emission period.

### Year 6+ (Zero Emissions)

**Net Supply Change** = 0 - Burns

- All burns directly reduce circulating supply
- No new tokens minted from rewards pool
- Pure deflationary pressure
- Scarcity increases over time

## Price Impact of Burns

### Direct Burn Creates Scarcity

Unlike buyback models that rely on market conditions, direct burning guarantees supply reduction:

**Example:**
- 1,000 players enter tournaments
- 10M 8BIT in fees collected
- 5M 8BIT burned immediately
- **Constant deflationary pressure regardless of market sentiment**

### Supply Reduction Increases Scarcity

**Basic Economics:**
- Same demand + Lower supply = Higher price
- As tokens burn, remaining tokens become more valuable
- Deflationary assets tend to appreciate over time

**Example Projection:**

| Year | Starting Supply | Tournament Burns | Net Supply |
|------|----------------|------------------|------------|
| 0 | 200M | 0 | 200M |
| 1 | 230M | 60M | 170M (net -30M) |
| 3 | 230M | 180M | 50M (net -150M) |
| 5 | 200M | 300M | **Net circulation heavily reduced** |

*Assumes moderate growth in tournament activity*

## Comparison to Other Models

### Typical Token Models

| Model | Supply Over Time | Examples |
|-------|------------------|----------|
| **Inflationary** | Always increasing | Most PoS chains, gaming tokens |
| **Fixed Supply** | Never changes | Bitcoin (eventually), many tokens |
| **Deflationary** | Decreasing | **8BIT**, BNB, ETH (post-merge) |

### Why Deflationary is Superior for Gaming

**Problem with Inflationary:**
- Constant sell pressure from emissions
- Token value decreases over time
- Late players earn worthless rewards

**Problem with Fixed Supply:**
- No mechanism to reward players
- Can't sustain play-to-earn model

**Deflationary Solution:**
- ✅ Rewards players during distribution phase
- ✅ Burns offset inflation
- ✅ Long-term holders benefit from scarcity
- ✅ Aligns player and investor incentives

## Real-World Deflationary Examples

### Binance Coin (BNB)

- **Mechanism:** Quarterly burns from exchange fees
- **Result:** Supply reduced from 200M to ~150M (25% burned)
- **Price Impact:** $15 → $600+ (4,000% gain)

### Ethereum (ETH)

- **Mechanism:** EIP-1559 burns base fees
- **Result:** Net deflationary since "The Merge"
- **Price Impact:** Positive sentiment, reduced sell pressure

### 8-Bit Arcade (8BIT)

- **Mechanism:** 50% of tournament fees → direct burn
- **Advantage:** Burns tied directly to platform usage
- **Sustainability:** More players = more tournaments = more burns

## Burn Transparency & Tracking

### View Burns in Real-Time

1. **[Burn Address on Arbiscan](https://arbiscan.io)**
   - See exact balance of burned tokens
   - View all burn transactions
   - Track burn rate over time

2. **[TournamentManager Contract](https://sepolia.arbiscan.io/address/0xe06C92f15F426b0f6Fccb66302790E533C5Dfbb7)**
   - View burn transactions
   - See entry fee amounts
   - Verify automatic execution

3. **[8-Bit Arcade Dashboard](https://8bitarcade.games/stats)** (Coming Soon)
   - Total tokens burned
   - Monthly burn rate
   - Historical burn chart
   - % of supply removed

### Burn Metrics

Track these key metrics to understand deflationary impact:

- **Total Burned:** Total 8BIT sent to burn address
- **Burn Rate:** Tokens burned per day/month
- **% of Supply:** Percentage of max supply burned
- **Net Inflation:** Emissions - Burns (positive = inflation, negative = deflation)

## Long-Term Supply Projection

### Conservative Path (Low Tournament Volume)

```
Year 0:  500M max supply, 200M circulating
Year 1:  170M circulating (+30M emissions, -60M burns)
Year 5:  50M circulating (+150M emissions, -300M burns)
Year 10: 20M circulating (0 emissions, -30M burns)
Year 20: 5M circulating (0 emissions, -15M burns)
```

**Result:** 99% supply reduction over 20 years

### Moderate Path (Medium Tournament Volume)

```
Year 0:  500M max supply, 200M circulating
Year 1:  110M circulating (+30M emissions, -120M burns)
Year 5:  Approaching minimum supply
```

**Result:** Extreme scarcity within 5 years

## What This Means for Token Value

### Supply & Demand Dynamics

**Demand Drivers (Buying Pressure):**
- Tournament entry requirements
- Player need to participate
- Investor speculation
- Staking requirements (future)
- NFT minting (future)

**Supply Factors:**
- New emissions (Years 1-5 only)
- Burns (continuous, forever)
- Lost wallets (permanent reduction)

**Net Effect:** Demand increases + Supply decreases = **Price appreciation**

### Deflation Incentivizes Holding

**Investor Psychology:**
- "Supply is decreasing, my tokens become scarcer"
- "No reason to sell, it'll be worth more later"
- "I'll hold and stake for passive income"

**Result:** Reduced sell pressure → More stable price → Higher valuations

## Why 50% Split?

### Tournament Fee Allocation

**50% to Prize Pool:**
- Ensures attractive prizes
- Incentivizes player participation
- Immediate value to winners

**50% to Burn:**
- Reduces circulating supply
- Benefits all holders long-term
- Creates deflationary pressure

**Why not 100% to prizes?**
- Wouldn't create deflationary pressure
- Token would be purely inflationary
- No long-term value accrual

**Why not 100% to burn?**
- Prizes would be too small
- Players wouldn't participate
- Platform wouldn't grow

**50/50 = Perfect Balance** ⚖️

## Future Deflationary Mechanisms

Additional burn sources being planned:

### NFT Badges (Phase 3)

- Mint exclusive achievement NFTs
- Pay 8BIT to mint
- 50% of minting fees burned
- Creates new burn source beyond tournaments

### Governance Proposals (Phase 4)

- Submit platform proposals
- Small 8BIT fee to prevent spam
- 100% of fees burned

### Premium Features (Future)

- Custom usernames
- Profile customization
- Exclusive games
- All paid in 8BIT, 50%+ burned

## Conclusion

The deflationary model ensures:

✅ **Long-term sustainability** - Burns offset emissions
✅ **Value accrual** - Remaining tokens become scarcer
✅ **Holder benefits** - All holders benefit from burns
✅ **Aligned incentives** - Players and investors both win
✅ **Transparent & trustless** - Smart contract enforced

**As adoption grows, deflationary pressure increases, creating a positive feedback loop for token value.**

## Next Steps

- [Emissions Schedule](emissions.md) - When new tokens are created
- [Market Scenarios](market-scenarios.md) - Price projections
- [Token Distribution](distribution.md) - Where tokens go
- [Tournaments](../earning/tournaments.md) - How to contribute to burns

---

*All burns are permanent, transparent, and verifiable on the Arbitrum blockchain. View the burn address anytime: `0x000000000000000000000000000000000000dEaD`*
