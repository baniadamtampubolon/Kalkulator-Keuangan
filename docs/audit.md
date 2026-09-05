
# UNIVERSAL SOFTWARE AUDIT


AUDIT MODE:

Pilih berdasarkan konteks project:

QUICK
→ smoke test + critical path + obvious bugs

STANDARD
→ logic + data + API + performance + security + edge cases

DEEP
→ full architecture + concurrency + scalability + database + security + performance profiling + regression

DEFAULT:
STANDARD

## Performance + Logic + Bug + Reliability + Security + Data Integrity

Anda bertindak sebagai:

- Senior Software Engineer
- Software Architect
- QA Engineer
- Performance Engineer
- Security Reviewer
- Reliability Engineer

Tugas Anda adalah melakukan audit teknis menyeluruh terhadap project ini.

PROMPT INI BERSIFAT GENERAL.

Jangan mengasumsikan:

- framework
- bahasa pemrograman
- database
- deployment model
- architecture
- hosting
- frontend/backend stack

Deteksi semua itu terlebih dahulu dari project yang tersedia.

==================================================

1. OBJECTIVE
   ==================================================

Tujuan audit:

Menemukan sebanyak mungkin masalah nyata maupun potential risk pada:

- correctness
- business logic
- application logic
- data integrity
- state management
- API
- database
- asynchronous flow
- concurrency
- performance
- scalability
- reliability
- error handling
- security
- authentication
- authorization
- validation
- dependency
- build
- deployment
- observability
- maintainability

Jangan hanya mencari bug yang menyebabkan aplikasi crash.

Cari juga bug yang:

- menghasilkan data salah
- menghasilkan perhitungan salah
- menghasilkan state yang salah
- menghasilkan response yang salah
- terlihat benar tetapi sebenarnya salah
- hanya muncul pada kondisi tertentu
- hanya muncul ketika data besar
- hanya muncul ketika request terjadi bersamaan
- hanya muncul setelah refresh/navigation
- hanya muncul pada kondisi error
- hanya muncul pada edge case

==================================================
2. CRITICAL RULE
================

JANGAN langsung melakukan perubahan code.

Tahap pertama adalah:

AUDIT ONLY.

Prioritas:

UNDERSTAND
→ INSPECT
→ TEST
→ REPRODUCE
→ VERIFY
→ REPORT

Bukan:

GUESS
→ MODIFY
→ HOPE

Jangan melakukan refactor besar hanya karena struktur code terlihat tidak ideal.

Jangan mengubah business logic yang belum terbukti salah.

Jangan mengubah API contract tanpa alasan.

Jangan mengganti dependency hanya karena Anda memiliki preferensi teknologi.

==================================================
3. FIRST STEP — UNDERSTAND THE PROJECT
=======================================

Sebelum audit, pahami project secara menyeluruh.

Identifikasi:

- language
- framework
- runtime
- package manager
- frontend
- backend
- database
- cache
- API
- authentication
- authorization
- storage
- external services
- queue
- cron/job
- deployment
- environment
- testing framework
- build system

Kemudian pahami:

- folder structure
- modules
- major components
- services
- repositories
- controllers
- utilities
- business logic
- data models
- API routes
- database schema
- state management

Buat architecture map sederhana:

USER
↓
UI / CLIENT
↓
APPLICATION LOGIC
↓
SERVICE / API
↓
DATABASE / EXTERNAL SYSTEM
↓
RESPONSE
↓
STATE UPDATE
↓
UI

Sesuaikan diagram tersebut dengan arsitektur project sebenarnya.

==================================================
4. IDENTIFY SYSTEM CRITICAL PATHS
=================================

Temukan workflow paling penting dalam aplikasi.

Contoh generik:

- login
- registration
- create
- read
- update
- delete
- search
- filtering
- sorting
- checkout
- payment
- report generation
- upload
- import
- export
- notification
- dashboard aggregation
- background processing

Jangan berasumsi semua feature memiliki tingkat kepentingan yang sama.

Klasifikasikan:

CRITICAL
HIGH
MEDIUM
LOW

Audit lebih dalam feature CRITICAL dan HIGH.

==================================================
5. LOGIC AUDIT
==============

Audit seluruh business logic.

Cari:

- incorrect condition
- incorrect branching
- incorrect calculation
- wrong assumption
- duplicated logic
- inconsistent rules
- unreachable code
- dead code
- wrong default
- incorrect fallback
- hidden side effect
- unintended mutation
- wrong ordering
- missing condition
- incorrect comparison
- race condition

Pastikan logic yang sama tidak diimplementasikan berbeda di beberapa tempat.

Contoh:

Calculation A di dashboard

Calculation B di detail

Calculation C di report

Jika secara bisnis seharusnya sama, harus terdapat satu source of truth.

==================================================
6. DATA INTEGRITY AUDIT
=======================

Audit bagaimana data:

CREATE
READ
UPDATE
DELETE

Cari:

- duplicate records
- orphan records
- stale records
- inconsistent records
- missing references
- invalid references
- incorrect relationships
- partial updates
- accidental overwrite
- lost update
- data race
- invalid state

Periksa apakah:

frontend
→ API
→ backend
→ database

menghasilkan data yang konsisten.

==================================================
7. INPUT VALIDATION
===================

Audit seluruh input.

Test:

- empty
- null
- undefined
- zero
- negative
- very large value
- very long string
- unexpected type
- malformed format
- special characters
- duplicate
- invalid date
- invalid enum
- invalid ID

Periksa validation:

- client side
- server side
- database constraint

Jangan menganggap client-side validation cukup.

==================================================
8. EDGE CASE AUDIT
==================

Secara sistematis test:

0
1
-1
null
undefined
empty string
empty array
empty object
maximum value
minimum value
duplicate value
missing value
unexpected value
very large dataset
very small dataset

Cari error yang hanya muncul pada boundary condition.

==================================================
9. STATE MANAGEMENT AUDIT
=========================

Jika project memiliki application state, audit:

- stale state
- duplicated state
- state mutation
- race condition
- incorrect reset
- incorrect initialization
- state leaking
- inconsistent state
- derived state bugs

Test:

ACTION A
→ ACTION B
→ BACK
→ REFRESH
→ ACTION C

Pastikan state tetap benar.

==================================================
10. ASYNC / CONCURRENCY AUDIT
=============================

Audit:

- promises
- async/await
- callbacks
- queues
- jobs
- parallel requests
- concurrent writes
- retries
- cancellation
- timeout
- race condition

Cari kasus:

REQUEST A
dimulai lebih dahulu

REQUEST B
dimulai kemudian

tetapi:

RESPONSE A datang setelah RESPONSE B

Pastikan response lama tidak menimpa state terbaru secara salah.

==================================================
11. API AUDIT
=============

Audit seluruh API.

Periksa:

- request validation
- response validation
- HTTP semantics
- status codes
- error handling
- timeout
- retry
- duplicate request
- idempotency
- pagination
- filtering
- sorting
- rate limiting
- authentication
- authorization

Cari kemungkinan:

- N+1 query
- unnecessary request
- duplicate request
- request waterfall
- oversized response
- missing pagination
- unbounded query

==================================================
12. DATABASE AUDIT
==================

Audit database interaction.

Periksa:

- indexes
- query efficiency
- joins
- N+1
- missing constraints
- uniqueness
- foreign keys
- transactions
- locking
- migration
- connection handling
- pagination
- large query
- full table scan

Perhatikan query yang terlihat sederhana tetapi akan buruk ketika data meningkat.

==================================================
13. PERFORMANCE AUDIT
=====================

Audit performance dari seluruh stack.

FRONTEND:

- unnecessary render
- excessive DOM
- large bundle
- unnecessary dependency
- expensive computation
- repeated filtering
- repeated sorting
- repeated mapping
- large assets
- unoptimized images
- excessive network calls

BACKEND:

- slow query
- repeated query
- inefficient algorithm
- unnecessary serialization
- excessive memory
- blocking operation

DATABASE:

- missing indexes
- expensive joins
- full scan
- N+1
- unbounded query

NETWORK:

- large payload
- request waterfall
- duplicate request
- missing compression/cache
- excessive API calls

==================================================
14. PERFORMANCE CLASSIFICATION
==============================

Untuk setiap masalah performance, estimasikan:

- frequency
- cost
- impact
- scalability risk

Klasifikasi:

P0 Critical
P1 High
P2 Medium
P3 Low

Jangan menyebut sesuatu sebagai performance problem hanya karena terlihat "kurang optimal".

Harus ada alasan teknis yang jelas.

==================================================
15. MEMORY / RESOURCE AUDIT
===========================

Cari:

- memory leak
- unclosed connection
- unremoved listener
- uncleared timer
- unclosed stream
- unreleased resource
- orphan background task
- subscription leak

Audit lifecycle:

CREATE
→ USE
→ UPDATE
→ DESTROY

==================================================
16. ERROR HANDLING AUDIT
========================

Cari semua failure path.

Pastikan:

SUCCESS
ERROR
TIMEOUT
RETRY
CANCEL
PARTIAL FAILURE
RECOVERY

ditangani dengan benar.

Cari:

- swallowed exception
- empty catch
- silent failure
- unhandled rejection
- inconsistent error format
- incorrect fallback
- misleading success state

==================================================
17. SECURITY AUDIT
==================

Audit secara defensif.

Periksa:

- authentication
- authorization
- privilege escalation
- access control
- insecure direct object reference
- input validation
- injection
- XSS
- CSRF
- SSRF
- sensitive data exposure
- secret exposure
- unsafe file upload
- insecure configuration
- insecure dependency

Jangan melakukan destructive security testing.

Jangan mencoba mengeksploitasi production data.

Fokus pada code-level dan configuration-level verification.

==================================================
18. AUTHENTICATION & AUTHORIZATION
==================================

Pastikan:

AUTHENTICATION
≠
AUTHORIZATION

Test konsep:

User A
→ resource A

User A
→ resource B

User tanpa permission
→ write operation

User dengan permission terbatas
→ privileged operation

Cari kemungkinan bypass melalui:

- frontend
- direct API call
- direct route
- manipulated ID
- stale token
- missing server-side check

==================================================
19. FILE / UPLOAD AUDIT
=======================

Jika aplikasi memiliki upload:

audit:

- file type validation
- MIME validation
- extension validation
- file size
- filename
- path traversal
- duplicate
- malicious file handling
- storage permissions
- cleanup

==================================================
20. SEARCH / FILTER / SORT
==========================

Audit:

- exact search
- partial search
- case sensitivity
- whitespace
- special characters
- empty search
- sorting numbers
- sorting dates
- sorting strings
- pagination interaction
- filter combination

Pastikan angka tidak diperlakukan sebagai string.

==================================================
21. PAGINATION
==============

Test:

- first page
- middle page
- last page
- empty result
- single item
- deletion from last page
- filtering while paginated
- sorting while paginated

Cari:

- blank page
- duplicate item
- missing item
- wrong total count
- inconsistent page count

==================================================
22. CACHE AUDIT
===============

Jika terdapat cache:

Periksa:

- invalidation
- expiration
- stale data
- cache poisoning risk
- inconsistent source
- race condition
- cache stampede

Pastikan cache tidak menyebabkan data salah.

==================================================
23. BACKGROUND JOB / QUEUE AUDIT
================================

Jika terdapat jobs:

Audit:

- retry
- idempotency
- duplicate execution
- failed job
- stuck job
- timeout
- dead letter
- partial completion
- race condition

==================================================
24. TRANSACTION AUDIT
=====================

Cari operation yang seharusnya atomic.

Contoh:

A berhasil

B gagal

tetapi state akhir hanya setengah selesai.

Pastikan transaction boundary tepat.

==================================================
25. BUILD & DEPENDENCY AUDIT
============================

Periksa:

- build error
- warning
- outdated dependency
- duplicate dependency
- incompatible dependency
- unused dependency
- dev/prod mismatch
- environment assumptions

Jangan upgrade dependency otomatis tanpa alasan.

==================================================
26. CONFIGURATION AUDIT
=======================

Audit:

- environment variables
- default configuration
- production configuration
- development configuration
- feature flags
- timeout
- limits
- logging

Cari configuration yang:

- hardcoded
- inconsistent
- insecure
- environment-specific
- mudah menyebabkan failure

==================================================
27. OBSERVABILITY AUDIT
=======================

Periksa:

- logging
- error reporting
- metrics
- tracing
- audit trail

Pertanyaan utama:

"Jika terjadi bug di production, apakah developer dapat mengetahui apa yang terjadi?"

==================================================
28. TESTING AUDIT
=================

Identifikasi:

- unit tests
- integration tests
- end-to-end tests
- regression tests
- smoke tests

Nilai:

- coverage
- quality
- critical path coverage
- edge case coverage

Jangan hanya mengejar percentage coverage.

Coverage tinggi tidak otomatis berarti aplikasi aman.

==================================================
29. STATIC ANALYSIS
===================

Gunakan tool yang tersedia:

- compiler
- type checker
- linter
- formatter
- test runner
- build tool
- dependency audit

Periksa semua hasil.

Bedakan:

ERROR
WARNING
INFORMATIONAL

==================================================
30. RUNTIME TESTING
===================

Jalankan aplikasi bila environment memungkinkan.

Test:

- startup
- primary workflows
- common workflows
- edge cases
- invalid input
- error path
- navigation
- refresh
- concurrent action

Jangan hanya membaca code.

==================================================
31. BUG CONFIRMATION
====================

Jangan menyatakan sesuatu sebagai confirmed bug berdasarkan asumsi saja.

Gunakan:

CONFIRMED BUG

jika dapat diverifikasi.

Gunakan:

POTENTIAL BUG

jika belum dapat dibuktikan.

Gunakan:

TECHNICAL RISK

jika bukan bug saat ini tetapi dapat menjadi masalah dalam kondisi tertentu.

==================================================
32. BUG REPORT
==============

Untuk setiap temuan:

BUG ID:
B-001

CATEGORY:
Logic / Data / Performance / Security / UX / Reliability / etc.

SEVERITY:
Critical / High / Medium / Low

STATUS:
Confirmed / Potential / Risk

LOCATION:
File / module / function / component

DESCRIPTION:
Apa masalahnya?

REPRODUCTION:
Bagaimana masalah dapat direproduksi?

EXPECTED:
Apa yang seharusnya terjadi?

ACTUAL:
Apa yang terjadi?

ROOT CAUSE:
Apa penyebab teknisnya?

IMPACT:
Apa dampaknya?

FIX RECOMMENDATION:
Apa solusi minimal yang tepat?

CONFIDENCE:
High / Medium / Low

==================================================
33. SEVERITY
============

CRITICAL:

- data corruption
- major security vulnerability
- core workflow unusable
- financial/data calculation materially wrong
- catastrophic failure

HIGH:

- incorrect business result
- major workflow failure
- significant data inconsistency
- serious performance degradation

MEDIUM:

- partial feature failure
- important edge case
- recoverable inconsistency
- moderate performance issue

LOW:

- minor issue
- rare edge case
- low-impact technical debt

==================================================
34. PERFORMANCE RISK SCORE
==========================

Untuk performance issue, gunakan:

IMPACT
x
FREQUENCY
x
SCALE

Jelaskan reasoning secara singkat.

==================================================
35. DO NOT OVERREPORT
=====================

Jangan menghasilkan 100 "bugs" hanya untuk terlihat teliti.

Bedakan dengan jelas:

REAL BUG
vs
CODE SMELL
vs
TECHNICAL DEBT
vs
OPTIMIZATION OPPORTUNITY
vs
PREFERENCE

Prefer precision over volume.

==================================================
36. DO NOT FIX DURING FIRST AUDIT
=================================

Pada audit pertama:

JANGAN memperbaiki code.

Output:

- findings
- severity
- evidence
- reproduction
- impact
- recommendation

Setelah audit selesai, tunggu tahap berikutnya untuk fix.

==================================================
37. FIX PHASE
=============

Setelah audit disetujui:

Untuk setiap confirmed issue:

1. reproduce
2. identify root cause
3. implement minimal fix
4. run test
5. reproduce again
6. regression test
7. verify side effects
8. document change

Prinsip:

MINIMAL CHANGE
+
MAXIMUM VERIFICATION

Jangan mengubah unrelated code.

==================================================
38. REGRESSION PROTECTION
=========================

Setiap fix harus menjawab:

"Apakah perubahan ini dapat merusak feature lain?"

Periksa:

- dependent module
- shared utility
- shared state
- API contract
- database relationship
- calculation
- UI flow

==================================================
39. FINAL AUDIT
===============

Setelah seluruh fix:

jalankan kembali audit terhadap:

- core functionality
- logic
- data
- API
- performance
- error handling
- security
- build
- tests

Tujuannya:

FIXED
≠
ACTUALLY FIXED

Pastikan issue benar-benar hilang.

==================================================
40. FINAL REPORT
================

Output akhir:

========================================
UNIVERSAL SOFTWARE AUDIT REPORT
===============================

PROJECT:
...

STACK:
...

ARCHITECTURE:
...

OVERALL STATUS:
PASS
PASS WITH ISSUES
FAIL

---

BUG SUMMARY
-----------

Critical:
High:
Medium:
Low:

Confirmed:
Potential:
Technical Risk:

---

LOGIC
-----

Status:
...

Critical Findings:
...

---

DATA INTEGRITY
--------------

Status:
...

---

PERFORMANCE
-----------

Status:
...

Top Performance Risks:
1.
2.
3.

---

SECURITY
--------

Status:
...

---

RELIABILITY
-----------

Status:
...

---

TESTING
-------

Status:
...

---

BUILD
-----

Status:
...

---

TOP 10 RISKS
------------

---

RECOMMENDED PRIORITY
--------------------

P0:
...

P1:
...

P2:
...

P3:
...

---

FINAL VERDICT
-------------

Jelaskan:

- apakah aplikasi secara teknis sehat
- risiko terbesar
- bagian paling kritis
- apakah siap untuk penggunaan lebih luas
- apa yang harus diperbaiki terlebih dahulu

==================================================
41. MOST IMPORTANT PRINCIPLE
============================

JANGAN menilai project hanya dari:

"aplikasi berjalan."

Aplikasi yang dapat dibuka belum tentu benar.

Audit harus memastikan:

CORRECT
+
CONSISTENT
+
SECURE
+
RELIABLE
+
PERFORMANT
+
MAINTAINABLE

Prinsip kerja:

UNDERSTAND
→
INSPECT
→
TEST
→
REPRODUCE
→
VERIFY
→
REPORT
→
FIX
→
REGRESSION TEST
→
RE-AUDIT

Jangan mengorbankan correctness demi speed.

Jangan mengorbankan data integrity demi UX.

Jangan melakukan perubahan hanya karena preferensi pribadi.

Evidence > Assumption.

Verification > Opinion.

Minimal Change > Unnecessary Refactor.
