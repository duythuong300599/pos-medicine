# Project Context Snapshot

- Generated: `2026-04-11T12:18:30+00:00`
- Source: `session-init`
- Work item: `260409-web-migration`

# Project Context

## Metadata
- Project type: `new-project`
- Workflow track: `default`
- Last updated: `2026-04-09T04:29:19+00:00`

## Why This Project Exists
- Problem statement: Hệ thống POS (Point of Sale) dành cho nhà thuốc nhỏ lẻ — giải quyết bài toán bán hàng tại quầy: tạo đơn, tính tiền, quản lý tồn kho thuốc, hỗ trợ dược sĩ thao tác nhanh trên mobile (iOS & Android). Mục tiêu là thay thế sổ sách/phần mềm desktop bằng app mobile tiện lợi, hoạt động offline.
- Success metrics: (1) Tạo và hoàn thành 1 đơn bán hàng < 30 giây; (2) App hoạt động offline 100% khi mất mạng; (3) Đồng bộ tồn kho chính xác sau khi có mạng trở lại.
- Primary users/personas: Dược sĩ bán hàng (front-desk pharmacist) — thao tác POS hằng ngày; Quản lý nhà thuốc — xem báo cáo, quản lý kho.
- Key user journey: Dược sĩ mở app → tìm thuốc → thêm vào giỏ → nhập số lượng → tính tiền → hoàn tất đơn → in/lưu hóa đơn.

## Discovery Decisions (fill before /plan)
- Chosen direction: Flutter mobile app (iOS & Android) + SQLite local storage. Hoạt động offline-first, đồng bộ optional sau này.
- Alternatives considered: React Native (Expo) — bị loại vì Flutter có UI nhất quán hơn trên cả 2 platform; Web app — bị loại vì cần offline support và UX nhanh trên mobile.
- Trade-offs accepted: Offline-first với SQLite — đồng nghĩa sync phức tạp hơn sau này, nhưng đảm bảo app dùng được ở vùng mạng kém.
- Non-goals: Không có backend/API trong MVP đầu tiên. Không hỗ trợ multi-user đồng thời. Không có web portal.
- Brainstorm confirmed (yes/no): yes

## Scope Contract
- In scope this sprint: MVP Core POS — bán hàng cơ bản: danh mục thuốc, tạo đơn, giỏ hàng, thanh toán, lịch sử giao dịch.
- Out of scope this sprint: Quản lý nhập kho, toa thuốc (prescription), báo cáo nâng cao, đồng bộ cloud, multi-store.
- Constraints (time/budget/compliance): Timeline linh hoạt, solo developer, cần tuân thủ quy định quản lý thuốc Việt Nam (sau này).
- Dependencies and owners: Solo developer (duythuong) — toàn bộ frontend + data layer.

## Architecture Snapshot
- System boundaries: Flutter mobile app (iOS/Android) ↔ SQLite local DB. Không có backend trong MVP.
- Core modules/services: (1) Product catalog — danh mục thuốc; (2) Cart — giỏ hàng; (3) Transaction — tạo/hoàn thành đơn; (4) Inventory — tồn kho cơ bản; (5) Receipt — in/lưu hóa đơn.
- Data model and storage: SQLite via `sqflite` package. Entities: Product, CartItem, Transaction, TransactionItem.
- External integrations: Không có trong MVP. Sau này: Bluetooth printer cho hóa đơn.
- Security and privacy assumptions: Dữ liệu lưu local, không truyền lên server. PIN lock app nếu cần.

## Execution Inputs For Workflow
- Plan entry criteria: Discovery reviewed, brainstorm answers captured, and readiness gate passed for the scoped work.
- Test strategy: Run targeted automated tests for changed modules plus regression checks on the critical user journey.
- Release strategy: Deliver in small PRs, require passing tests/review, and stage rollout with rollback ready.
- Rollback strategy: Use revert-ready deployment plan and data-safe rollback steps before merge/release.

## Risks and Mitigations
- High risk 1: Repository hoàn toàn trống — không có source code -> Xác nhận problem statement và tech stack TRƯỚC khi bất kỳ code nào được viết. Điền docs/project-context.md đầy đủ.
- High risk 2: Thiếu README — onboarding bị tắc ngay từ đầu -> Tạo README.md tối thiểu với: mô tả dự án, tech stack dự kiến, prerequisites, và setup steps sau khi stack được chọn.
- Unknowns requiring research: Problem statement cụ thể: 'pos-medicine' giải quyết vấn đề gì chính xác (nhà thuốc nhỏ lẻ? chuỗi? bệnh viện?); Primary user persona: dược sĩ bán hàng, quản lý nhà thuốc, hay khách hàng?; Tech stack quyết định: frontend framework, backend language, database, deployment target

<!-- AUTO-BRAINSTORM-START -->
## Brainstorming Questions (Answer Before /plan)

- 1. What is the single most important business outcome this repository must deliver in this sprint?
- 2. Who is the primary user persona, and what pain point must be solved first?
- 3. Which user journey is highest priority for this sprint (from entry to successful outcome)?
- 4. What is the confirmed local startup path (dependencies, env setup, run command) that we should standardize?
- 5. Which modules own business-critical logic among: plans/260409-1126-workflow-init, AGENTS.md, CLAUDE.md?
- 6. Can you clarify: Problem statement cụ thể: 'pos-medicine' giải quyết vấn đề gì chính xác (nhà thuốc nhỏ lẻ? chuỗi? bệnh viện?)?
- 7. Can you clarify: Primary user persona: dược sĩ bán hàng, quản lý nhà thuốc, hay khách hàng??
- 8. Can you clarify: Tech stack quyết định: frontend framework, backend language, database, deployment target?
<!-- AUTO-BRAINSTORM-END -->

## Checklist Before /cook
- [ ] Discovery decisions are explicit and conflict-free
- [ ] Scope and non-goals are agreed
- [ ] Acceptance criteria are testable
- [ ] Critical risks have owners

<!-- AUTO-DISCOVERY-START -->
## Auto Discovery Snapshot

- Generated: `2026-04-09T04:30:52+00:00`
- Source: `document-project deep`
- Root: `/Users/duythuong/Documents/DuyTCode/pos-medicine`
- Purpose guess (0.45): Purpose is unclear from static signals. Run deeper discovery and inspect business modules.
- Architecture guess: Architecture appears mixed or monolithic; deeper scan may be required for precise boundaries.

### Top-level Structure

- `docs`
- `plans`

### Detected Stacks

- Unknown

### Dominant Languages

- Unknown

### Serious Findings

- [high] Missing README. Onboarding and architecture comprehension will be slow.
- [medium] No obvious automated test footprint found.
- [low] No CI workflow directory detected (.github/workflows).

### Next Actions

- Update docs/project-context.md using this scan output before /plan
- Run /check-readiness and resolve high-risk findings before /cook
- Create a targeted plan with /plan referencing this scan

### Startup Hints

- No startup hints detected

### Repository Index

- `plans/260409-1126-workflow-init`: unknown (files: 10)
- `AGENTS.md`: unknown (files: 1)
- `CLAUDE.md`: unknown (files: 1)
- `docs/project-context.md`: unknown (files: 1)
- `docs/sharded`: unknown (files: 1)
- `plans/project-scan-report.json`: unknown (files: 1)
- `plans/project-scan-report.yaml`: unknown (files: 1)
- `plans/work-items.yaml`: unknown (files: 1)
- `plans/workflow-init-report.json`: unknown (files: 1)
- `plans/workflow-init-report.yaml`: unknown (files: 1)
- `plans/workflow-status.yaml`: unknown (files: 1)
- `plans/project-analysis-input.json`: unknown (files: 1)

### AI Synthesis

- overall_confidence: 0.35 (gate_pass=False)
- purpose: Dự án "pos-medicine" có khả năng cao là hệ thống Point of Sale (POS) dành cho nhà thuốc / cửa hàng dược phẩm — giải quyết bài toán quản lý bán hàng, tồn kho thuốc, và giao dịch tại quầy. Dự án đang ở giai đoạn khởi tạo (new-project / discovery), chưa có source code, chỉ có scaffolding workflow từ ClaudeKit.
- architecture: Chưa có kiến trúc thực sự nào được xác định. Repository hiện tại chỉ gồm hai thư mục: `docs/` (tài liệu dự án) và `plans/` (workflow state của ClaudeKit). Không có source code, không có dependency files (package.json, requirements.txt, go.mod…), không có Dockerfile, không có CI/CD. Tên dự án "pos-medicine" gợi ý một monolith hoặc fullstack web app cho quản lý nhà thuốc — nhưng stack chưa được chọn. Kiến trúc runtime, ranh giới module, và tích hợp ngoài hoàn toàn chưa xác định.

### Brainstorm Questions

- 1. What is the single most important business outcome this repository must deliver in this sprint?
- 2. Who is the primary user persona, and what pain point must be solved first?
- 3. Which user journey is highest priority for this sprint (from entry to successful outcome)?
- 4. What is the confirmed local startup path (dependencies, env setup, run command) that we should standardize?
- 5. Which modules own business-critical logic among: plans/260409-1126-workflow-init, AGENTS.md, CLAUDE.md?
- 6. Can you clarify: Problem statement cụ thể: 'pos-medicine' giải quyết vấn đề gì chính xác (nhà thuốc nhỏ lẻ? chuỗi? bệnh viện?)?
- 7. Can you clarify: Primary user persona: dược sĩ bán hàng, quản lý nhà thuốc, hay khách hàng??
- 8. Can you clarify: Tech stack quyết định: frontend framework, backend language, database, deployment target?

<!-- AUTO-DISCOVERY-END -->

## Operational Runtime Snapshot

- work_item_state: `discovery`
- handoff_status: `draft`
- lifecycle_stage: `planning`
- lifecycle_status: `idle`
- active_command: ``
- last_heartbeat_at: ``
- recovery_command: ``

## Plan Progress Snapshot

- plan_status_path: `plans/260409-web-migration/plan-status.yaml`
- plan_status: `not-started`
- progress_pct: `0.0`
- active_phase: `plan` (not-started)
