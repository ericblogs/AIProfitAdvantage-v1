# Gate 9D — Certificate Artifact & Student Credential Experience

## Objective
Provide an authoritative learner credential experience backed by the certified APEP certificate ledger.

## Scope
- Student dashboard certification records.
- Certificate number and credential status.
- Controlled verification entry point.
- Administrative issuance/reissue/revocation remains authoritative through certified RPCs.
- No automatic certificate issuance from progress alone.

## Eligibility baseline
A learner must have an active enrollment in a published course and completion evidence for every published lesson in that course. Issuance is performed by an authorized administrator.

## Credential lifecycle
ISSUED → REISSUED → SUPERSEDED or REVOKED.

## Runtime acceptance criteria
1. Authenticated learner can open Dashboard → Certifications.
2. Empty ledger displays a professional no-certificate state.
3. Issued credentials render certificate number, course and status.
4. Verification link resolves to the public certificate verification surface.
5. Administrator can issue only an eligible learner credential.
6. Reissue supersedes the prior credential and creates a new certificate number.
7. Revocation requires a reason and changes the authoritative status.
8. Non-admin users cannot execute administrative certification mutations.
9. No Paystack, provider governance, onboarding or Course Player behavior changes.
