# Firestore Security Specification - HELOREX SHOP

## Data Invariants
1. A Product must have a name, price, category, and image.
2. A Category must have an ID, name, and image.
3. An Order must belong to a user (via UID) and have valid customer details.
4. Admin access is strictly controlled by a whitelist of emails and a 'role' field in the 'users' collection.
5. User profiles (PII) are restricted to the owner and admins.

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing:** Create an order with `uid: "other-user-id"`.
2. **State Shortcutting:** Create an order with `status: "delivered"`.
3. **Resource Poisoning:** Create a category with a 2MB Base64 image.
4. **Admin Escalation:** Update own user document to set `role: "admin"`.
5. **PII Leak:** Read another user's document in the `users` collection.
6. **Orphaned Write:** Create a product with a `category` that doesn't exist.
7. **Shadow Update:** Update a product's price and "isAdmin" field (ghost field).
8. **Malicious ID:** Create a category with `id: "../invalid/path"`.
9. **Unverified Auth:** Write to a protected resource with `email_verified: false`.
10. **Query Scraper:** List all orders without a `uid` filter (as non-admin).
11. **Immortal Field Breach:** Update an order's `createdAt` timestamp.
12. **Price Manipulation:** Update a product's price to a negative value.

## Implementation Strategy
- Use `isValidOrder()`, `isValidProduct()`, `isValidCategory()` helpers.
- Use `isAdmin()` helper check for all write operations on catalog.
- Use named update actions for branching logic.
- Enforce strict schemas on create and update.
