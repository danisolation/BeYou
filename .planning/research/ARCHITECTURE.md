# Architecture Patterns

**Project:** BeYou  
**Domain:** Web app ho tro suc khoe tinh than, ap luc ban be, SOS cho hoc sinh THPT Viet Nam  
**Researched:** 2026-05-20  
**Confidence:** Medium-High

## Khuyen nghi kien truc tong the

BeYou nen bat dau bang **modular monolith** voi Python backend, REST API, frontend web responsive, co so du lieu quan he va cac module domain tach ro. Khong nen tach microservices trong MVP vi domain con dang validate, nhung phai thiet ke ranh gioi module sach de co the tach sau nay.

```text
[Web Frontend]
    |
    | HTTPS + JSON REST
    v
[Python API Backend]
    |
    +-- Auth & Authorization
    +-- User / Role / Student Link Module
    +-- Assessment/Test Module
    +-- Scenario Module
    +-- Chatbot Module
    +-- SOS Module
    +-- Notification Module
    +-- Report/Admin Module
    +-- Audit/Safety Logging
    |
    v
[Relational Database]
    |
    +-- users, roles, student_links
    +-- tests, test_questions, test_attempts, test_results
    +-- scenarios, scenario_choices, scenario_attempts
    +-- chat_sessions, chat_messages, safety_events
    +-- sos_alerts, sos_status_events, notifications
    +-- reports / aggregate snapshots
    |
    v
[External LLM Provider: freemodel.dev]
```

## Kien truc de xuat

### 1. Frontend Web App

Frontend hien thi dashboard theo role va goi backend API. Backend la source of truth duy nhat cho quyen truy cap du lieu.

**Trach nhiem:**

- Hien thi dashboard cho student, teacher, parent, admin.
- Goi API backend.
- Khong chua API key chatbot.
- Khong tu quyet dinh quyen truy cap du lieu nhay cam.
- Khong luu token hoac du lieu tam ly dai han trong local storage neu co the tranh.
- Dung ngon ngu nhe nhang, khong y khoa hoa qua muc.

**Khong lam:**

- Khong goi truc tiep freemodel.dev.
- Khong tinh toan quyen xem hoc sinh o frontend.
- Khong tu suy luan risk state cho teacher/parent/admin neu backend chua cap quyen.

### 2. Python Backend API

Backend la lop trung tam cho business logic, authorization, guardrails, audit va tich hop chatbot.

Khuyen nghi cau truc:

```text
app/
  api/
    routes/
      auth.py
      students.py
      tests.py
      scenarios.py
      chat.py
      sos.py
      notifications.py
      admin.py
      reports.py
  core/
    config.py
    security.py
    authorization.py
    audit.py
    errors.py
  domains/
    users/
    student_links/
    assessments/
    scenarios/
    chatbot/
    sos/
    notifications/
    reports/
  integrations/
    llm/
      base.py
      freemodel.py
  db/
    models.py
    migrations/
```

## Component Boundaries

| Component | Trach nhiem | Khong chiu trach nhiem | Giao tiep voi |
|---|---|---|---|
| Frontend Web | UI, form, dashboard, role-specific navigation | Authorization that, chatbot API key, risk calculation nhay cam | Backend API |
| Auth Module | Login, password hash, session/JWT, current user | Quan he student-teacher-parent | User module, Authorization |
| Authorization Module | Quyet dinh user co duoc thao tac tren resource khong | UI rendering | Tat ca API route |
| User/Role Module | User, role, profile, account status | Test result, SOS | Auth, Admin |
| Student Link Module | Quan he student-teacher-parent-class | Tao user, cham diem test | Authorization, SOS, Reports |
| Assessment Module | Tests, questions, attempts, scoring, risk level | Canh bao SOS truc tiep neu chua qua policy | Dashboard, Reports |
| Scenario Module | Tinh huong, lua chon, feedback, attempt history | Danh gia tam ly lam sang | Dashboard, Admin |
| Chatbot Module | Chat session, message, guardrails, provider abstraction | Tri lieu chuyen nghiep, goi LLM tu frontend | LLM integration, SOS |
| SOS Module | Alert, trang thai xu ly, escalation state | External SMS/Zalo trong v1 | Notifications, Student Links |
| Notification Module | In-app notification, read/unread, target recipients | Push/SMS/email v1 | SOS, Reports |
| Reports Module | Aggregate reports, admin/teacher summaries | Expose raw private data khong can thiet | Assessments, SOS |
| Audit/Safety Logging | Ghi su kien bao mat, quyen, high-risk, SOS | Luu noi dung nhay cam qua muc | Tat ca module |

## Role-Based Authorization Model

RBAC don thuan chua du. BeYou can ket hop:

1. **RBAC**: user co role gi.
2. **Relationship-based access**: user co quan he gi voi hoc sinh nao.
3. **Resource ownership**: du lieu thuoc hoc sinh nao.
4. **Purpose limitation**: teacher/parent chi thay du lieu can thiet de ho tro, khong phai toan bo noi dung rieng tu.

### Roles chinh

| Role | Quyen chinh |
|---|---|
| Student | Lam test, xem ket qua cua minh, dung scenarios/chatbot, tao SOS, xem lich su cua minh |
| Teacher | Xem hoc sinh duoc phan cong, risk summary, SOS lien quan, cap nhat trang thai SOS |
| Parent | Xem hoc sinh duoc lien ket, SOS lien quan, warning duoc phep xem, goi y ho tro |
| Admin | Quan ly user, content, tests, scenarios, chatbot content, bao cao tong hop |

### Quy tac authorization quan trong

| Resource | Student | Teacher | Parent | Admin |
|---|---|---|---|---|
| Own profile | Read/update limited | No | No | Read/manage |
| Student test attempt | Own full access | Summary neu linked/managed | Limited summary neu linked | Full/manage |
| Test content | Take/read active | Read active | Maybe read advice only | CRUD |
| Scenario content | Use active | Optional read | Optional read | CRUD |
| Chat messages | Own access | Khong mac dinh xem | Khong mac dinh xem | Khong mac dinh xem raw; chi audit/safety neu co policy |
| Chat safety event | Own visible as guidance | Summary neu escalated/SOS | Summary neu escalated/SOS | Audit access |
| SOS alert | Own created alerts | Neu linked/managed recipient | Neu linked recipient | Full/manage |
| Reports | Own dashboard only | Class/managed aggregate | Child-specific limited | Aggregate/system |

### Chinh sach rieng tu de xuat

- Teacher/parent khong nen xem toan bo noi dung chat.
- Teacher/parent chi nhan SOS alert, risk level, time, student-provided SOS message neu co, va support suggestion.
- Raw chatbot messages chi nen dung cho chinh hoc sinh, safety classifier/guardrail noi bo, hoac audit/admin che do han che neu co policy ro.
- Dashboard teacher/parent nen uu tien summary and action, khong phai surveillance.

## Data Model Domains

### Users / Roles

```text
users
- id
- email
- password_hash
- display_name
- role: student | teacher | parent | admin
- status: active | disabled
- created_at
- updated_at

student_profiles
- user_id
- grade
- class_name
- school_name optional
- avatar/mood optional

teacher_profiles
- user_id
- department optional

parent_profiles
- user_id
- phone optional
```

### Student Links

```text
student_links
- id
- student_id
- linked_user_id
- link_type: teacher | parent
- relationship_label
- status: active | pending | revoked
- created_by
- created_at
```

Day la bang trung tam cho authorization cua teacher/parent.

### Tests / Assessments

```text
tests
- id
- title
- description
- type: mental_wellbeing | peer_pressure | custom
- status: draft | active | archived

test_questions
- id
- test_id
- prompt
- order
- question_type
- scoring_weight

test_choices
- id
- question_id
- label
- score_value

test_attempts
- id
- student_id
- test_id
- started_at
- completed_at
- status

test_answers
- id
- attempt_id
- question_id
- choice_id
- value

test_results
- id
- attempt_id
- total_score
- risk_level: low | medium | high | critical
- advice_text
- visibility_level
- created_at
```

### Scenarios

```text
scenarios
- id
- title
- context
- category
- status

scenario_choices
- id
- scenario_id
- choice_text
- feedback_text
- skill_tag
- is_recommended

scenario_attempts
- id
- student_id
- scenario_id
- selected_choice_id
- feedback_seen_at
- created_at
```

### Chat Sessions / Messages

```text
chat_sessions
- id
- student_id
- status: active | closed
- safety_state: normal | watch | high_risk
- created_at
- updated_at

chat_messages
- id
- session_id
- sender: student | assistant | system
- content
- safety_label
- created_at

chat_safety_events
- id
- session_id
- student_id
- event_type: high_risk_detected | sos_suggested | refusal | escalation_guidance
- severity
- metadata
- created_at
```

### SOS Alerts / Statuses

```text
sos_alerts
- id
- student_id
- message optional
- source: manual | chatbot_suggestion | test_high_risk
- severity: urgent | high | medium
- status: sent | received | supporting | completed | cancelled
- created_at
- completed_at

sos_recipients
- id
- sos_alert_id
- recipient_user_id
- recipient_role
- read_at

sos_status_events
- id
- sos_alert_id
- actor_id
- from_status
- to_status
- note optional
- created_at
```

### Notifications

```text
notifications
- id
- recipient_user_id
- type: sos_alert | sos_status_update | risk_update | admin_notice
- title
- body
- related_resource_type
- related_resource_id
- read_at
- created_at
```

### Reports

```text
report_snapshots
- id
- report_type
- scope_type: student | class | system
- scope_id
- generated_by
- data_json
- created_at
```

Reports nen dung du lieu tong hop, tranh expose raw chat/test answers neu khong can.

## Data Flow Direction

### Flow 1: Lam bai test

```text
Student UI
  -> GET /tests/active
  -> POST /test-attempts
  -> POST /test-attempts/{id}/answers
  -> Backend scoring engine
  -> Store test_result
  -> Update student risk summary
  -> Return result/advice to student
  -> Optional: create safety event if high/critical
  -> Optional: notify linked adults if policy allows
```

Nguyen tac:

- Scoring phai nam o backend.
- Frontend khong tu tinh risk level.
- Teacher/parent chi xem summary theo policy.
- High/critical result khong tu dong gui SOS neu chua co product decision; nen hien thi goi y SOS va support resources truoc.

### Flow 2: Chatbot

```text
Student UI
  -> POST /chat/sessions/{id}/messages
  -> Backend stores student message
  -> Safety pre-check
      -> if high risk: create safety_event, return escalation guidance, suggest SOS
      -> else continue
  -> Backend calls LLM provider abstraction
  -> Safety post-check on assistant response
  -> Store assistant message
  -> Return safe response
```

Nguyen tac:

- Frontend khong goi freemodel.dev.
- API key chi nam o backend.
- LLM provider phai qua interface de thay sau.
- Chatbot khong duoc tu nhan la chuyen gia tri lieu.
- High-risk path phai uu tien an toan hon trai nghiem chat lien tuc.

### Flow 3: SOS

```text
Student UI
  -> POST /sos-alerts
  -> Backend validates student identity
  -> Find linked active teachers/parents
  -> Create sos_alert
  -> Create sos_recipients
  -> Create in-app notifications
  -> Return status = sent

Teacher/Parent UI
  -> GET /notifications
  -> GET /sos-alerts/{id}
  -> POST /sos-alerts/{id}/status-events
  -> Backend checks recipient authorization
  -> Update status
  -> Notify student and other recipients
```

Nguyen tac:

- SOS phai la domain rieng, khong chi la notification.
- Notification la delivery layer; SOS la source of truth.
- Moi doi trang thai SOS phai co audit trail.
- Teacher/parent chi thay SOS neu co active link voi student hoac la recipient.

## Patterns to Follow

### Pattern 1: Modular Monolith

Mot backend deploy chung nhung chia module domain ro rang. Phu hop MVP co nhieu domain nhay cam nhung chua du scale de microservices.

### Pattern 2: Policy-Based Authorization

Moi endpoint goi authorization service thay vi check role thu cong rai rac.

```python
def require_can_view_student(actor, student_id):
    if not authz.can_view_student_summary(actor, student_id):
        raise ForbiddenError()
```

### Pattern 3: Backend-Only LLM Gateway

Tat ca chatbot requests di qua backend abstraction.

```python
class LLMProvider:
    async def complete(self, messages, safety_context):
        raise NotImplementedError


class FreeModelProvider(LLMProvider):
    async def complete(self, messages, safety_context):
        ...
```

### Pattern 4: Audit Trail cho hanh dong nhay cam

Audit cac su kien:

- Login that bai nhieu lan.
- Xem du lieu hoc sinh.
- Tao/cap nhat SOS.
- Admin sua test/scenario/chatbot content.
- Chat high-risk detection.
- Teacher/parent xem alert.

Khong nen log raw noi dung nhay cam qua muc. Log metadata va resource id la chinh.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Role Check Don Gian

**Sai:**

```python
if user.role == "teacher":
    return student_result
```

**Dung:**

```python
if user.role == "teacher" and has_active_teacher_student_link(user.id, student_id):
    return limited_student_summary
```

### Anti-Pattern 2: Frontend Tu Quyet Dinh Privacy

API chi tra dung field actor duoc phep xem. Khong tra full data roi an field o frontend.

### Anti-Pattern 3: Chatbot Tu Dong Tao SOS Khong Kiem Soat

High-risk detection nen tao safety event, dua guidance va de xuat SOS. Auto-SOS chi nen lam neu product/legal policy ro rang.

### Anti-Pattern 4: Gop SOS Vao Notification

`sos_alerts` la nguon su that; `notifications` chi la kenh bao.

### Anti-Pattern 5: Admin Co Quyen Xem Raw Chat Mac Dinh

Admin quan ly content va aggregate reports. Raw sensitive data can quyen audit rieng, co ly do va log truy cap.

## Build Order Implications

### Phase 1: Foundation, Auth, Authorization, Data Model

Lam truoc vi moi flow con lai phu thuoc identity va privacy.

- User model.
- Role model.
- Password hashing.
- Login/session.
- Authorization service.
- Student links.
- Seeded demo accounts.
- Base audit logging.

Khong nen bat dau chatbot/SOS truoc khi authorization model on.

### Phase 2: Student Dashboard + Tests

- Active tests.
- Attempts.
- Scoring.
- Results.
- Risk level.
- Student history.
- Teacher/parent limited summary.

Test results la risk state chinh cho dashboard va reports.

### Phase 3: Scenarios

- Scenario content.
- Choices.
- Feedback.
- Student attempts.
- Admin CRUD.

Scenarios it rui ro hon chatbot/SOS, tot de hoan thien content/admin patterns.

### Phase 4: SOS + In-App Notifications

- SOS alert model.
- Recipient resolution tu student_links.
- Notification inbox.
- Status workflow: sent -> received -> supporting -> completed.
- Audit trail.

SOS phu thuoc student_links, role auth va notification infrastructure.

### Phase 5: Chatbot Gateway + Guardrails

- Chat sessions/messages.
- freemodel.dev provider abstraction.
- Safety pre-check/post-check.
- High-risk escalation guidance.
- SOS suggestion.

Chatbot la vung rui ro cao nhat; nen lam sau khi da co SOS va auth foundation.

### Phase 6: Reports/Admin Hardening

- Admin reports.
- Aggregates.
- Content moderation.
- Audit review.
- Privacy review.

Reports de leak du lieu neu lam som khi policy chua ro.

## Privacy and Safety Boundaries

### Du lieu can bao ve manh

- Test answers.
- Test results/risk level.
- Chat messages.
- Chat safety events.
- SOS alerts.
- Student-parent/teacher relationships.
- Any report involving mental-health state.

### Nguyen tac du lieu

- Private by default.
- Field-level response shaping theo role.
- Khong expose raw chat cho teacher/parent.
- Khong expose toan bo test answers cho parent/teacher neu summary la du.
- Moi endpoint nhay cam phai check ca role va relationship.
- Audit access vao du lieu nhay cam.
- API key LLM chi o backend.
- Khong dung chatbot nhu diagnosis tool.

## Scalability Considerations

| Concern | MVP / 100 users | 10K users | 1M users |
|---|---|---|---|
| Backend | Modular monolith | Scale horizontally, add cache | Split heavy modules if needed |
| Database | Single relational DB | Index by student_id, role, created_at | Read replicas, partition sensitive event tables |
| Chatbot | Synchronous API call okay | Queue/rate limit LLM calls | Dedicated chatbot service |
| Notifications | DB-backed inbox | Background job fanout | Event-driven notification service |
| Reports | On-demand aggregate | Scheduled snapshots | Data warehouse/analytics pipeline |
| Authorization | In-code policy service | Central policy module + tests | External policy engine possible |

## Critical Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Teacher/parent xem nham du lieu hoc sinh khong lien quan | Very high | Relationship-based authorization, policy tests |
| Raw chatbot data bi expose | Very high | Khong expose raw chat ngoai student; audit admin access |
| LLM dua loi khuyen nguy hiem | High | Guardrails pre/post, crisis guidance, SOS suggestion |
| SOS bi coi nhu notification thuong | High | SOS domain rieng, status trail, recipients |
| Admin report leak du lieu ca nhan | High | Aggregate by default, suppress small groups, no raw export in MVP |
| Frontend chua API key freemodel.dev | High | Backend-only provider abstraction |
| Risk scoring khong nhat quan | Medium-high | Backend scoring service, version tests |
| Qua som microservices | Medium | Modular monolith until scale requires split |

## Sources

- FastAPI Security documentation: https://fastapi.tiangolo.com/tutorial/security/
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- Project context: `.planning/PROJECT.md`
