# Adversarial Architecture Spine Review — Smart Expense Splitter

## Overall verdict
While the spine is solid, an adversary could exploit ambiguities in user and member identification, leading to incompatible frontend and backend integrations.

## Finding 1 — User Identification Conflict (medium)
* **Description:** AD-3 enforces Clerk authentication, but the spine does not define whether Group members and expense payers are identified in the database by their Clerk User IDs (e.g., `user_2b...`) or by custom MongoDB ObjectIds. Two developers building the React frontend and Express models independently could mismatch this, leading to broken joins and balance calculations.
* **Fix:** Add an AD or a Consistency Convention clarifying that all user references in the Group and Expense schemas must use the Clerk User ID string as the unique key.

## Finding 2 — Cents-based Rounding Policies (low)
* **Description:** The Consistency Conventions specify storing currencies as integers in cents. However, if splits result in fractional cents (e.g., splitting $10.00 equally among 3 people leads to 333.333... cents), the rounding rules are not defined. One developer might round up, while another truncates, leading to transaction validation failures.
* **Fix:** Add a rule under consistency conventions specifying that split shares must be rounded to the nearest cent, and the remaining cents must be assigned to the payer or first split member to ensure the sum always exactly matches the total cents.
