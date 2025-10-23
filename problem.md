# Referral Network Challenge

Build the engine of a referral network. Across four stages you'll design a graph that never breaks, highlight who really drives it, project how growth compounds, and tune the leanest bounty that keeps the flywheel spinning.

## What we value

- **Original thinkers** — We're looking for people who own their code. You should be able to explain every line and why it's there. If an interviewer can reconstruct your intent faster than you can, that's a red flag.
- **Depth over breadth** — An incomplete submission that's clean, correct, and thoughtfully optimized is stronger than a rushed "complete" one.

## Part 1 — Graph

Implement a `ReferralNetwork`, a graph whose nodes are unique strings and edges mean referrer → candidate. The graph must always satisfy:

- no self-referrals
- each candidate has at most one referrer
- acyclicity (reject any edge that would create a cycle)

Operations that would violate a rule must raise `ReferralError` and leave the graph unchanged (atomicity).

```python
class ReferralError(ValueError): ...

class ReferralNetwork: 
    def add_referral(self, referrer: str, candidate: str) -> None: …
    def direct_referrals(self, user: str) -> Iterable[str]: …
    def all_referrals(self, user: str) -> Iterable[str]: ...
```

- `add_referral(referrer, candidate)` adds a directed edge or raises `ReferralError` without side effects.
- `direct_referrals(user)` returns only the immediate children of user.
- `all_referrals(user)` returns both the direct and the indirect children of user.

## Part 2 — Influence

Rank users by two metrics as pure functions that accept a `ReferralNetwork` and do not mutate it:

- **Reach(u)**: number of distinct descendants of u.
- **Flow centrality(u)**: for ordered pairs (s, t) of distinct users with s ≠ u ≠ t, count how often u lies on a shortest directed path from s to t. Endpoints do not count as on the path.

Implement:

```python
def top_k_by_reach(network: ReferralNetwork, k: int) -> list[str]: …
def top_k_by_flow_centrality(network: ReferralNetwork, k: int) -> list[str]: …
```

## Part 3 — Growth

Model expected growth over discrete days. Each referrer begins with a lifetime capacity of 10 successful referrals. On any day, an active referrer can make at most one successful referral, independently, with probability p. A success consumes one unit of that referrer's remaining capacity; when capacity reaches 0, the referrer becomes inactive. Every success creates a new referrer with full capacity who joins at the start of the next day (no same-day activity). At the start of day 0 there are 100 active referrers.

Implement:

```python
def expected_network_size(p: float, days: int) -> float: 
    ...
```

Return the expected network size at the end of day `days`. This equals the initial 100 plus the expected number of successful referrals made during days 0..days.

## Part 4 — Incentive

A cash bonus is offered in $10 increments. For any bonus, the per-day participation probability is given by a monotonically non-decreasing black-box function `adoption_prob(bonus)`, which should be treated as expensive.

Implement:

```python
def min_bonus_for_target(days: int, target_network_size: int, adoption_prob) -> Optional[int]:
    ...
```

Return the smallest bonus that gets the expected network size to the target or higher by the end of the period. If no bonus can get there, return `None`.

## Submission

Make your GitHub repository private and add your interviewer as a collaborator.
