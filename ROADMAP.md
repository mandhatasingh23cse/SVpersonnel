# Delivery roadmap

The full acceptance criteria for each module are in REQUIREMENTS.md. This branch delivers public discovery and staffing intake. The following modules still require implementation or migration, integration tests and operational acceptance.

- **1. Existing Project Audit** — Baseline inspected. Complete the route, data and permission inventory before migration.
- **2. Business Verticals** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **3. Existing Service Catalogue** — Existing catalogue drives discovery. Validate category ownership and pricing.
- **4. User Roles And Access Control** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **5. Customer Application** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **6. Booking Engine** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **7. Intelligent Worker Dispatch** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **8. Live Gps Tracking** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **9. Otp Service Verification** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **10. Service Timer And Attendance** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **11. Worker Application** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **12. Automated Kyc And Verification** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **13. Training And Quality Management** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **14. Customer Subscriptions** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **15. Agency Partner Portal** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **16. Agency Subscriptions And Lead Marketplace** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **17. Permanent Hiring And Job Portal** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **18. Corporate Manpower Management** — MySQL enquiry intake implemented. Defer contracts, attendance, bulk recruitment and invoicing.
- **19. Pricing Engine** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **20. Payment, Finance And Payouts** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **21. Revenue Streams** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **22. Communication System** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **23. Safety And Trust** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **24. Quality, Reviews And Disputes** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **25. Admin Super Dashboard** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **26. City Operations And Service Hubs** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **27. Ai And Automation** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **28. Marketing And Customer Retention** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **29. Ui/Ux Design** — Homepage, discovery and intake implemented. Defer dashboard redesign and native surfaces.
- **30. Technology Stack** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **31. Complete Project Folder Structure** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **32. Database Design** — Staffing intake uses MySQL. Defer legacy migration until reconciliation and rollback tests pass.
- **33. Api Architecture** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **34. Security And Privacy** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **35. Performance And Scalability** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **36. Testing** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **37. Deployment** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **38. Development Phases** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.
- **39. Final Deliverables** — Deferred. Use this module’s requirements and dependencies in the master specification as its acceptance checklist.

## Delivery sequence and release gates
1. Inventory role permissions and reconcile existing identities, catalogues and financial balances against a disposable MySQL import. Require a restore rehearsal before cutover.
2. Introduce service coverage, eligibility and time-slot inventory. Exercise concurrent slot claims, cancellations and duplicate submissions before enabling instant or scheduled fulfilment.
3. Build worker dispatch, consent-based GPS, expiring OTPs, attendance and incident response around the booking state machine. Test denied permissions, offline events and duplicate callbacks.
4. Add subscription entitlements, agency lead allocation, candidate consent and permanent hiring pipelines. Verify ownership boundaries for customers, agencies and applicants.
5. Extend corporate intake into contracts, shift rosters, reconciliation and invoices. Validate rates, taxes, refunds and payouts against sandbox gateway events.
6. Complete native apps, operations tooling, worker training, accessibility review and security testing. Pilot one service area with verified workers. Production publication requires owner approval.

Corporate intake now includes a private paginated admin inbox. Contracting and fulfilment remain deferred.
