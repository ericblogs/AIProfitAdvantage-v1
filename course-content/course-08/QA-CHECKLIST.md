# Course 08 Integration QA Checklist

- [ ] 20 lesson artifacts present
- [ ] Lesson numbering contiguous 01–20
- [ ] Course-player routes map to the same 20 lesson slugs
- [ ] No Course 01–07 files modified by Course 08 implementation
- [ ] Production `courses` record created only after artifact review
- [ ] 20 `lessons` rows map one-to-one to content paths
- [ ] Active price = ₦85,000 NGN
- [ ] Course remains unpublished until runtime QA
- [ ] Authentication and paid-access boundary verified
- [ ] Enrollment creation verified
- [ ] Lesson progress verified
- [ ] Paystack amount/reference verified server-side
- [ ] Admin intelligence derives catalog count from database
- [ ] Console/network regression review completed
- [ ] No production deployment or merge before approval