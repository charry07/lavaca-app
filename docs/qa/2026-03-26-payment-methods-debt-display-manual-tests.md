# Payment Methods & Debt Display - Manual QA Checklist

Date: 2026-03-26
Scope: Profile payment methods management + session debt payment instructions
Environment: Expo app (iOS/Android/Web)

## Checklist

- [ ] Privacy guard
  Steps:
  1. Login as User A and User B.
  2. Ensure User A and User B are not in the same open session with debt relation.
  3. As User B, open any session and verify User A payment accounts are not visible.
  Expected:
  - Payment account details are only shown to users who currently owe that creditor in the session.

- [ ] Preferred sorting
  Steps:
  1. Add at least 2 payment accounts for a user.
  2. Mark one as preferred.
  3. Re-open profile and debt section.
  Expected:
  - Preferred account appears first.
  - Preferred account shows starred indicator.

- [ ] Multiple accounts rendering
  Steps:
  1. Add Nequi, Daviplata, and bank account methods for creditor.
  2. Open debtor view for the same session.
  Expected:
  - All active accounts render in debt payment instructions.
  - Account-specific fields (phone/account number/llave/document) appear correctly.

- [ ] Debt calculation correctness
  Steps:
  1. Equal split: verify debtor amount matches assigned split and creditor is session admin.
  2. Roulette split: verify creditor is roulette winner.
  Expected:
  - Amount and creditor identity match session split mode and participant amount.

- [ ] Clipboard behavior
  Steps:
  1. Tap account fields (phone, account number, llave, document) in debt instructions.
  2. Paste into a text input.
  Expected:
  - Tapped value is copied exactly.
  - Success toast is shown.

- [ ] Mark-paid flow
  Steps:
  1. From debtor account, tap "Mark as paid" in debt instructions.
  2. Verify participant status transitions to reported.
  3. Verify admin can approve/reject in participant list.
  Expected:
  - Debtor sees payment reported confirmation.
  - Admin sees and can process reported payment.

## Notes

- Typecheck status: passing (`pnpm typecheck`).
- This checklist intentionally focuses on runtime validation not covered by automated tests.
