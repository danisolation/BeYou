# Feature Landscape

**Domain:** Ung dung web ho tro suc khoe tinh than, ap luc dong trang lua va can thiep an toan cho hoc sinh THPT Viet Nam  
**Project:** BeYou  
**Researched:** 2026-05-20  
**Overall confidence:** Medium

## Tom tat dinh huong

BeYou khong nen duoc dinh vi nhu "ung dung tri lieu" hay "cong cu chan doan". Voi hoc sinh THPT, dac biet la tre vi thanh nien, san pham can uu tien: nhan dien som cang thang, giao duc ky nang ung pho, khuyen khich tim nguoi lon dang tin cay, va tao luong SOS an toan.

V1 nen tap trung vao cac luong cot loi trong vision: hoc sinh lam bai kiem tra ngan, luyen tinh huong ap luc hoc duong, chat ho tro co guardrails, gui SOS, va giao vien/phu huynh nhan canh bao trong app. Cac tinh nang giam sat hoac phan tich sau can gioi han de tranh bien san pham thanh cong cu theo doi hoc sinh.

Tieu chuan quan trong cho tre vi thanh nien: minh bach du lieu, dong y phu hop voi phu huynh/nguoi giam ho khi can, phan quyen nghiem ngat, khong hua "bi mat tuyet doi" neu co nguy co tu hai/bao luc, va khong de chatbot xu ly khung hoang mot minh.

## Table Stakes

| Feature | Vi sao can co | Complexity | Dependencies | Notes |
|---|---|---:|---|---|
| Dang ky/dang nhap theo vai tro | Bat buoc de tach student, teacher, parent, admin | Medium | Auth, RBAC, seeded demo accounts | Khong cho teacher/parent xem du lieu ngoai pham vi lien ket |
| Dashboard hoc sinh | Diem bat dau than thien, khong lam sang | Low-Med | Auth, profile, assessment history | Hien thi trang thai nhe nhang: on, can chu y, nen tim ho tro |
| Bai kiem tra ngan ve stress/tam trang/ap luc ban be | Cot loi de hoc sinh tu nhan dien van de | Medium | Question bank, scoring, history | Khong goi la chan doan; chi la self-check |
| Ket qua bai kiem tra co muc rui ro va goi y hanh dong | Hoc sinh can biet nen lam gi tiep theo | Medium | Assessment scoring, content library | Rui ro cao: goi y noi voi nguoi lon/SOS |
| Lich su bai kiem tra ca nhan | Giup hoc sinh va nguoi ho tro thay xu huong | Medium | Data model, privacy rules | Parent nen thay muc canh bao/tom tat duoc phep, khong thay chi tiet nhay cam |
| Tinh huong hoc duong thuc te | Phu hop domain ap luc dong trang lua | Medium | Scenario CMS, feedback rules | Vi du: bi co lap, bi bat nat online, ap luc diem so |
| Feedback sau moi lua chon scenario | Tao gia tri giao duc, khong chi quiz | Medium | Scenario branching/content | Giai thich vi sao lua chon an toan/khong an toan |
| Chatbot ho tro cam xuc co ban | Co trong vision, giup hoc sinh tiep can thap ap luc | High | Python backend, LLM provider, safety classifier, logging policy | Bot phai noi ro khong phai chuyen gia/tri lieu |
| Guardrails cho chatbot | Bat buoc vi san pham lien quan tre vi thanh nien va suc khoe tinh than | High | Risk detection, escalation copy, SOS flow | Phat hien tu hai, bao luc, lam dung, khung hoang cap tinh |
| SOS trong app | Cot loi: ket noi hoc sinh voi nguoi lon dang tin cay | High | Linked teacher/parent, alert model, status workflow | V1 khong can SMS/Zalo nhung phai ro trang thai gui/nhan/xu ly |
| Trang thai xu ly SOS | Tranh canh bao bi bo quen | Medium | Notification center, assignee, audit log | sent -> received -> supporting -> completed |
| Portal giao vien | Giao vien xem hoc sinh duoc phan cong, canh bao, SOS | Medium-High | RBAC, student-teacher linkage, summaries | Khong bien thanh bang xep hang "hoc sinh co van de" |
| Portal phu huynh | Phu huynh nhan canh bao va goi y ho tro | Medium | Student-parent linkage, privacy boundaries | Ngon ngu huong dan, khong phan xet |
| Admin CMS cho bai test | Can quan tri noi dung khong hard-code | Medium | Admin role, content schema | Tao cau hoi, diem, muc rui ro |
| Admin CMS cho scenarios | Can cap nhat tinh huong theo boi canh truong hoc Viet Nam | Medium | Scenario editor | V1 co the dung editor don gian |
| Admin quan ly chatbot content/FAQ | Giup bot tra loi theo noi dung an toan da kiem soat | Medium-High | Retrieval/content rules, backend abstraction | Can tranh prompt injection va lo du lieu |
| Bao cao tong hop | Nha truong/admin can nhin xu huong chung | Medium | Aggregation, privacy filters | Chi aggregate; tranh lo danh tinh neu nhom qua nho |
| Chinh sach quyen rieng tu de hieu cho hoc sinh | Bat buoc de tao niem tin | Medium | Legal/content, onboarding | Noi ro ai thay gi, khi nao thong tin duoc chia se |
| Consent/assent cho tre vi thanh nien | Can cho du lieu nhay cam | High | Onboarding, parent linkage, policy | Xu ly du lieu tre em theo Nghi dinh 13/2023/ND-CP can luu y dong y phu hop |
| Audit log cho hanh dong nhay cam | Can cho an toan va truy vet | Medium | Backend logging, admin controls | Log ai xem/cap nhat SOS, ai xem du lieu hoc sinh |
| Thiet ke mobile-first, nhe nhang | Hoc sinh dung dien thoai nhieu; mental health app can it gay ap luc | Low-Med | UI system | Tranh mau do tru SOS/rui ro cao |

## Differentiators

| Feature | Value Proposition | Complexity | Dependencies | Recommendation |
|---|---|---:|---|---|
| Lo trinh ky nang ca nhan hoa | Goi y bai hoc/scenario theo rui ro va lich su | High | Assessment history, recommendation rules | Defer sau MVP |
| Trusted adult plan | Hoc sinh tu chon nguoi lon tin cay va ke hoach lien he | Medium | Profile, SOS contacts, privacy policy | Can nhac v1.5 |
| Mood check-in hang ngay/tuan | Theo doi xu huong nhe hon test dai | Medium | Dashboard, trend storage | Defer neu v1 da co tests |
| Thu vien ky nang ung pho | Noi dung ngan: tho, noi "khong", tim ho tro, xu ly bat nat | Medium | CMS | Co the dua ban nho vao v1 |
| Ke hoach an toan ca nhan | Hoc sinh ghi dau hieu canh bao, viec giup binh tinh, nguoi can goi | High | Privacy, crisis policy, UX safety | Defer; can chuyen gia review |
| Escalation routing theo muc rui ro | Goi y teacher/parent/admin phu hop | High | Risk engine, role linkage, policy | Defer neu chua co quy trinh truong hoc |
| Dashboard xu huong lop/truong | Giup admin thay chu de noi bat | Medium-High | Aggregation, anonymization | Chi aggregate; tranh nhom nho |
| Content localization sau cho Viet Nam | Tinh huong sat thi cu, gia dinh, MXH, lop hoc them | Medium | Content research | Dau tu dan, la diem khac biet lon |
| Parent coaching cards | Goi y phu huynh nen noi gi/khong nen noi gi | Medium | Content library, alert context | Phu hop sau v1 |
| Teacher intervention templates | Goi y cach trao doi rieng, ghi nhan, chuyen tuyen | Medium | Content library | Can review boi chuyen gia/nha truong |
| Human counselor handoff | Ket noi chuyen vien tu van that | Very High | Staffing, SLAs, legal, privacy | Khong nen lam trong MVP demo |
| External notifications: SMS/Zalo/email/push | Tang kha nang phan hoi SOS | High | Provider integration, consent, delivery audit | Out of scope v1 |
| Multi-school tenancy | Dung cho nhieu truong doc lap | High | Tenant model, admin hierarchy | Defer |
| Anonymous school climate survey | Phan anh ap luc/bat nat khong neu ten | Medium-High | Abuse prevention, moderation | Defer do rui ro moderation |

## Anti-Features / Dangerous Patterns

| Anti-Feature | Vi sao tranh | Lam gi thay the |
|---|---|---|
| Chatbot tu nhan la nha tri lieu/chuyen gia chan doan | Tao niem tin sai; AI khong thay the cham soc chuyen mon | Bot noi ro la ho tro ban dau, khuyen tim nguoi lon/chuyen gia |
| Chan doan benh tam than tu bai test | Self-check khong du co so lam sang | Dung muc canh bao va goi y ho tro |
| Hua "moi thu luon bi mat" | Sai khi co nguy co an toan | Giai thich privacy boundary ro rang |
| Cho phu huynh xem toan bo chat/raw assessment | Lam hoc sinh mat niem tin va ne tranh ho tro | Chi chia se canh bao, tom tat an toan, goi y ho tro |
| Dashboard xep hang hoc sinh theo "rui ro" | De ky thi, phat sai doi tuong | Danh sach ho tro kin, phan quyen hep |
| Theo doi an/giam sat hanh vi ngoai app | Bien san pham thanh surveillance | Chi thu du lieu hoc sinh chu dong nhap |
| Tu dong goi cong an/cap cuu khong qua xac nhan/quy trinh | Co the gay hai, sai ngu canh, trach nhiem cao | V1: SOS in-app den nguoi lon lien ket, emergency guidance ro |
| Gamification khung hoang/SOS | Lam nhe hoa nguy co hoac khuyen khich dung sai | Giu SOS nghiem tuc, ro rang, it thao tac |
| Public social feed/chia se tam trang voi ban be | Rui ro bat nat, lo du lieu nhay cam | Defer; neu lam can moderation manh |
| LLM goi truc tiep tu frontend | Lo API key, kho guardrails, lo du lieu | Tat ca qua Python backend |
| Dung du lieu hoc sinh de train model mac dinh | Rui ro rieng tu cao | Khong training neu chua co consent va danh gia phap ly |
| Xoa/sua SOS khong co audit | Mat truy vet khi co su co | Audit log bat buoc cho alert/status |
| Noi dung "positive vibes only" | Co the phu nhan cam xuc that | Cong nhan cam xuc, huong dan hanh dong cu the |
| Admin sua diem test da co lich su khong versioning | Lam sai lech ket qua cu | Version noi dung hoac luu snapshot cau hoi/diem |

## Feature Dependencies

```text
Auth + RBAC
  -> Student dashboard
  -> Teacher/parent/admin portals
  -> Privacy boundaries
  -> Audit log

User linkage: student <-> teacher / parent
  -> SOS routing
  -> Teacher risk overview
  -> Parent alert view

Assessment CMS
  -> Student tests
  -> Scoring/risk levels
  -> Test history
  -> Teacher/parent permitted summaries
  -> Aggregate reports

Scenario CMS
  -> Student realistic scenarios
  -> Choice feedback
  -> Skill guidance

Python backend + LLM provider abstraction
  -> Chatbot counseling
  -> Safety guardrails
  -> High-risk detection
  -> SOS suggestion from chat

SOS model
  -> In-app notification
  -> Status workflow
  -> Teacher/parent action tracking
  -> Audit log

Privacy/consent policy
  -> Onboarding copy
  -> Data visibility rules
  -> Parent access boundaries
  -> Admin reporting limits
```

## MVP Recommendation

Uu tien v1:

1. Auth + RBAC + seeded demo accounts.
2. Student dashboard.
3. Short self-check tests with scoring, risk level, advice, and history.
4. Realistic peer-pressure/school scenarios with feedback.
5. Chatbot through Python backend with clear non-therapy disclaimer and high-risk guardrails.
6. SOS in-app alert to linked teacher/parent with status tracking.
7. Teacher view: managed students, warning levels, SOS alerts.
8. Parent view: linked student alerts and support suggestions.
9. Admin CMS: users, tests, scenarios, chatbot content.
10. Privacy defaults: strict authorization, consent copy, audit log for sensitive actions.

Defer:

- External notifications via SMS/Zalo/email/push.
- Human counselor handoff.
- Personalized learning paths.
- Multi-school tenancy.
- Anonymous reporting/community features.

## Privacy, Consent, and Safeguarding Expectations

| Expectation | v1 Requirement |
|---|---|
| Data minimization | Chi thu du lieu can cho tests, scenarios, chatbot, SOS |
| Private by default | Teacher/parent chi thay hoc sinh duoc lien ket |
| Minor consent/guardian awareness | Onboarding giai thich du lieu nhay cam va quyen truy cap |
| No absolute confidentiality | Noi ro truong hop nguy co an toan se can bao nguoi lon dang tin cay |
| Sensitive data access logging | Ghi log khi nguoi lon/admin xem hoac xu ly SOS |
| High-risk escalation | Chat/test/SOS huong hoc sinh den nguoi lon dang tin cay va kenh khan cap phu hop |
| Vietnamese emergency context | Co the hien thi Tong dai bao ve tre em 111; 113/115 chi nen dung trong huong dan khan cap, khong tu dong goi |
| Safe copywriting | Tranh ngon ngu do loi, benh ly hoa hoac lam hoc sinh so bi phat |
| Parent/teacher guidance | Cung cap nen lam gi tiep theo, khong chi canh bao |

## Sources

- Project context: `.planning/PROJECT.md`
- Nghi dinh 13/2023/ND-CP ve bao ve du lieu ca nhan: https://vanban.chinhphu.vn/?pageid=27160&docid=207759
- Tong dai Quoc gia Bao ve Tre em 111: https://tongdai111.vn/
- U.S. Department of Education Student Privacy Policy Office: https://studentprivacy.ed.gov/
- GOV.UK Keeping Children Safe in Education: https://www.gov.uk/government/publications/keeping-children-safe-in-education--2
- WHO stress guidance: https://www.who.int/news-room/questions-and-answers/item/stress
- JED Foundation AI and youth mental health POV: https://www.jedfoundation.org/artificial-intelligence-youth-mental-health-pov/
- Common Sense Media AI chatbots for teen mental-health support: https://www.commonsensemedia.org/press-releases/common-sense-media-finds-major-ai-chatbots-unsafe-for-teen-mental-health-support
