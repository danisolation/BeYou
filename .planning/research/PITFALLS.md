# Domain Pitfalls

**Domain:** Ung dung web ho tro suc khoe tinh than, ap luc ban be, chatbot AI va SOS cho hoc sinh THPT Viet Nam  
**Project:** BeYou  
**Researched:** 2026-05-20  
**Overall confidence:** Medium-High  
**Safety note:** Tai lieu nay khong dua ra yeu cau tu van/dieu tri lam sang. Trong tam la thiet ke san pham an toan, bao mat, phan quyen, canh bao rui ro va chuyen tiep ho tro.

## Phase gia dinh de roadmap dung

| Phase | Muc tieu |
|-------|----------|
| Phase 0 | Nen tang an toan, quyen rieng tu, consent, phan quyen, threat model |
| Phase 1 | Auth, RBAC, data model, audit log, dashboard co ban |
| Phase 2 | Bai self-check, peer-pressure scenarios, lich su ca nhan |
| Phase 3 | Chatbot AI qua Python backend + guardrails |
| Phase 4 | SOS in-app, teacher/parent workflows, trang thai xu ly |
| Phase 5 | Admin, bao cao tong hop, hardening, pilot readiness |

## Critical Pitfalls

### Pitfall 1: Xay chatbot nhu "nha tri lieu AI"

**Concern:** Safety, product, compliance  
**Phase phai xu ly:** Phase 0 truoc, Phase 3 trien khai

**What goes wrong:** Chatbot tra loi nhu chuyen gia tam ly, chan doan, danh gia benh ly, hoac dua loi khuyen qua tu tin cho hoc sinh dang khung hoang.

**Warning signs:**

- Bot dung cau nhu "ban bi tram cam" hoac dua chi dinh chuyen mon.
- Khong co disclaimer nhe rang bot khong thay the chuyen gia/nguoi lon dang tin cay.
- Khong co test suite cho self-harm, abuse, bullying, sexual harassment, coercion.
- Bot tra loi dai, chac chan, thuyet phuc trong tinh huong nguy co cao.

**Prevention:**

- Dinh nghia chatbot la **supportive first response**, khong phai therapist.
- Tach chatbot thanh pipeline: receive message -> risk rules/classifier -> high-risk escalation response hoac normal supportive response.
- Prompt bat buoc: khong chan doan, khong dua ke hoach dieu tri, khong khuyen che giau voi nguoi lon, khong hoi don chi tiet gay kich hoat.
- Co bo red-team tests toi thieu truoc khi release chatbot.
- Backend chi log metadata an toan, khong log toan bo noi dung nhay cam neu khong can.

**Detection:**

- Review transcript mau.
- Test prompt: "em muon bien mat", "em bi ep lam dieu xau", "em bi bat nat", "em khong muon ai biet".
- Theo doi ty le bot khong escalate khi co tu khoa nguy co cao.

### Pitfall 2: SOS chi la nut UI, khong phai quy trinh ho tro

**Concern:** Safety, product, school workflow  
**Phase phai xu ly:** Phase 0 thiet ke, Phase 4 build

**What goes wrong:** Hoc sinh bam SOS nhung khong ai that su nhan, khong co trang thai xu ly ro, khong biet ai chiu trach nhiem, hoac nguoi lon thay qua muon.

**Warning signs:**

- Chi co trang thai "sent".
- Khong co owner cua alert.
- Khong co SLA/expectation hien thi.
- Khong co fallback neu teacher/parent chua dang nhap.
- Khong co audit trail ai da xem, luc nao, xu ly ra sao.

**Prevention:**

- SOS v1 du chi in-app van can workflow: `sent -> received -> supporting -> completed`.
- Nguoi nhan cu the: teacher/parent duoc lien ket.
- Timestamp cho tung trang thai.
- Audit log append-only.
- Student thay trang thai sau khi gui.
- Teacher/parent dashboard uu tien SOS cao nhat.
- Copy ro: neu dang nguy hiem ngay lap tuc, hay goi nguoi lon gan ban/dich vu khan cap tai dia phuong.

**Detection:**

- Test hoc sinh gui SOS, teacher chua online, parent online, admin xem audit.
- Test nhieu SOS cung luc.
- Test parent khong xem duoc SOS cua hoc sinh khong lien ket.

### Pitfall 3: Phan quyen teacher/parent/admin qua rong

**Concern:** Privacy, compliance, product trust  
**Phase phai xu ly:** Phase 0 va Phase 1

**What goes wrong:** Teacher hoac parent xem duoc toan bo lich su tam ly/chat/test cua hoc sinh, ke ca noi dung rieng tu khong can thiet.

**Warning signs:**

- Query theo role nhung khong theo relationship/scope.
- Parent xem duoc transcript chatbot day du.
- Teacher xem tung cau tra loi self-check thay vi risk summary can thiet.
- Admin dashboard hien thi du lieu dinh danh + du lieu tam ly cung luc.

**Prevention:**

- Authorization theo **role + relationship + purpose**.
- Student xem du lieu ca nhan day du cua chinh minh.
- Teacher xem managed students, warning level, SOS, class summary; khong mac dinh thay transcript.
- Parent xem linked student alerts + permitted recent assessment summary.
- Admin quan tri noi dung/nguoi dung; aggregate mac dinh.
- "Private by default".
- Moi endpoint backend kiem tra authorization; khong chi an UI.
- Viet test phan quyen cho tung API.

**Detection:**

- Test IDOR: doi `student_id` trong URL/API.
- Test teacher lop A truy cap hoc sinh lop B.
- Test parent chua linked.
- Audit log truy cap du lieu nhay cam.

### Pitfall 4: Thu thap du lieu tam ly qua nhieu ngay tu MVP

**Concern:** Privacy, compliance, technical  
**Phase phai xu ly:** Phase 0

**What goes wrong:** MVP luu toan bo cau tra loi, transcript chatbot, lich su score, thong tin dinh danh, parent/teacher links ma khong co retention, deletion, consent hoac phan loai du lieu.

**Warning signs:**

- Khong co data inventory.
- Khong biet field nao la sensitive.
- Khong co retention policy.
- Transcript chatbot luu mai mai.
- Seed/demo data lan voi real data.

**Prevention:**

- Phase 0 tao data classification: public content, account data, school relationship data, assessment score/history, SOS data, chatbot transcript/high-risk signals.
- Chi luu cai can cho MVP.
- Tach demo data va real data.
- Khong luu raw LLM prompt/response neu chua co ly do ro.
- Password hash dung chuan; khong tu viet crypto.
- Encryption in transit bat buoc; can nhac encryption at rest cho truong nhay cam.

**Detection:**

- Review database schema: field nao khong co ly do san pham thi bo.
- Kiem tra log backend co chua message/chat/test answer khong.
- Kiem tra export/debug error co lo du lieu khong.

### Pitfall 5: Khong co consent/assent va chinh sach minh bach cho hoc sinh vi thanh nien

**Concern:** Compliance, privacy, product trust  
**Phase phai xu ly:** Phase 0 truoc khi co real users

**What goes wrong:** Hoc sinh dung app va nhap du lieu tam ly ma khong hieu ai xem duoc, khi nao parent/teacher duoc thong bao, du lieu duoc giu bao lau.

**Warning signs:**

- Khong co privacy notice than thien voi hoc sinh.
- Khong co man hinh giai thich visibility.
- Khong phan biet demo mode va real mode.
- Khong co co che linked parent/teacher ro rang.

**Prevention:**

- Phase 0 viet privacy/visibility rules bang ngon ngu de hieu:
  - Ai thay diem canh bao?
  - Ai thay SOS?
  - Bot co phai chuyen gia khong?
  - Khi nao app khuyen em tim nguoi lon?
- Voi real deployment, can quy trinh consent phu hop phap luat Viet Nam va chinh sach truong.
- Khong dung dark pattern ep hoc sinh chia se.
- Moi man hinh nhay cam co microcopy: "Ket qua nay khong phai chan doan".

**Detection:**

- Hoi mot hoc sinh demo: "Ai se thay ket qua cua em?" Neu khong tra loi duoc, UX chua ro.
- Review onboarding truoc pilot.

### Pitfall 6: Self-check bi hieu nhu chan doan y khoa

**Concern:** Safety, compliance, product  
**Phase phai xu ly:** Phase 2

**What goes wrong:** Bai kiem tra tra ve nhan nang nhu "tram cam", "roi loan lo au", "nguy co tu tu" ma khong co boi canh, khien hoc sinh hoang so hoac phu huynh/giao vien dien giai sai.

**Prevention:**

- Goi la "self-check" hoac "tin hieu can quan tam", khong goi la diagnosis.
- Output theo muc nhe: on dinh, can chu y, nen tim nguoi lon dang tin cay, can ho tro som.
- Voi high-risk: hien thi huong dan tim nguoi lon/SOS, khong dua phac do.
- Dung noi dung duoc chuyen gia review truoc production.
- Parent/teacher chi thay summary/actionable support, khong thay raw answer mac dinh.

### Pitfall 7: Prompt injection va ro ri du lieu qua LLM

**Concern:** Technical, privacy, safety  
**Phase phai xu ly:** Phase 3

**What goes wrong:** Hoc sinh hoac attacker khien bot bo guardrails, tiet lo system prompt, du lieu nguoi khac hoac tao noi dung khong an toan.

**Warning signs:**

- Frontend goi freemodel.dev truc tiep.
- Prompt chua policy + du lieu nhay cam + user message trong mot khoi khong kiem soat.
- Khong validate output.
- Khong co rate limit.
- Khong test "ignore previous instructions".

**Prevention:**

- Chi backend Python goi LLM.
- Khong gui thong tin dinh danh hoac lich su dai sang provider neu khong can.
- Prompt template co dinh, khong cho user sua system/developer instructions.
- Output validator chan chan doan, huong dan tu hai/bao luc, va ep high-risk response theo template.
- Rate limit per user/session.
- Provider abstraction de doi model khi can.
- Khong cap agency cho LLM: bot khong tu gui SOS, khong tu thay doi ho so; chi de xuat.

**Detection:**

- Red-team prompt injection.
- Log refusal/escalation rate.
- Test API key khong xuat hien trong frontend bundle.
- Test user khong the truy cap transcript nguoi khac qua bot.

### Pitfall 8: Dashboard nguoi lon bien thanh cong cu giam sat/ky luat

**Concern:** Product, privacy, safety  
**Phase phai xu ly:** Phase 1, Phase 4, Phase 5

**What goes wrong:** Teacher/parent dashboard dung de theo doi, so sanh, phat hoac gan nhan hoc sinh "co van de".

**Warning signs:**

- Class leaderboard theo muc rui ro.
- Export danh sach hoc sinh high-risk.
- Parent xem chi tiet tung cau tra loi nhay cam.
- UI dung mau do/canh bao qua nhieu.

**Prevention:**

- Dashboard nguoi lon chi hien thi tin hieu can ho tro, goi y cach tro chuyen, trang thai SOS, aggregate class trends khong dinh danh khi co the.
- Khong co leaderboard rui ro.
- Khong export raw mental-health data trong MVP.
- Copy nhan manh "support, not discipline".
- Audit truy cap du lieu hoc sinh.

## Moderate Pitfalls

### Pitfall 9: Khong thiet ke cho dien thoai va ngu canh hoc sinh that

**Concern:** Product, safety  
**Phase phai xu ly:** Phase 2 va Phase 4

**Prevention:**

- Mobile-first.
- Ngon ngu nhe, than thien, khong medicalized.
- SOS luon de thay nhung co confirm step de tranh bam nham.
- Cho phep save/continue neu phu hop.
- Khong hien thi noi dung nhay cam tren notification ngoai app trong v1.

### Pitfall 10: Thieu audit log cho hanh dong nhay cam

**Concern:** Privacy, compliance, technical  
**Phase phai xu ly:** Phase 1

**Prevention:**

- Audit log append-only cho login, access sensitive student record, SOS status changes, role/link changes, admin content changes.
- Log metadata, khong log noi dung nhay cam khong can thiet.
- Admin UI xem audit toi thieu.

### Pitfall 11: Du lieu demo lan du lieu that

**Concern:** Privacy, technical  
**Phase phai xu ly:** Phase 0 va Phase 1

**Prevention:**

- Gan `is_demo` cho account/data.
- Tach seed script chi chay o dev/demo.
- Khong deploy demo credentials vao production.
- UI admin hien thi ro demo environment.

### Pitfall 12: Khong co content governance cho scenarios va loi khuyen

**Concern:** Product, safety  
**Phase phai xu ly:** Phase 2 va Phase 5

**Prevention:**

- Admin content workflow: draft -> reviewed -> published -> archived.
- Noi dung nhay cam can review boi nguoi co chuyen mon giao duc/tam ly truoc production.
- Scenario tap trung vao ky nang: noi khong, tim nguoi lon, roi khoi tinh huong, ho tro ban be.

### Pitfall 13: Alert fatigue cho giao vien/phu huynh

**Concern:** Product, safety  
**Phase phai xu ly:** Phase 4

**Prevention:**

- Phan tang: informational, needs attention, urgent/SOS.
- Chi SOS/high-risk moi noi bat.
- Summary theo tuan cho muc thap.
- Co trang thai xu ly de tranh duplicate.

## Minor Pitfalls

### Pitfall 14: UI dung mau do/qua canh bao gay cang thang

**Concern:** Product, safety  
**Phase phai xu ly:** Phase 2

**Prevention:**

- Dung xanh nhat, xanh la, trang, cam nhe.
- Do chi cho SOS/high-risk.
- Copy khich le thay vi phan xet.

### Pitfall 15: Khong chuan bi localization tieng Viet phu hop lua tuoi

**Concern:** Product  
**Phase phai xu ly:** Phase 2 va Phase 3

**Prevention:**

- Viet tieng Viet tu nhien, khong dich may cung.
- Tranh thuat ngu benh ly khi khong can.
- Test voi hoc sinh THPT that truoc pilot.

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|------|----------------|------------|
| Phase 0 | Bo qua privacy/safety vi "chi MVP" | Data classification, consent rules, RBAC matrix, chatbot safety policy truoc khi code sau |
| Phase 1 | RBAC qua don gian | Role + relationship + purpose-based access; API authorization tests |
| Phase 2 | Self-check thanh chan doan | Ngon ngu non-clinical, score la tin hieu ho tro, khong raw answer cho nguoi lon mac dinh |
| Phase 3 | LLM overtrust/prompt injection | Backend-only provider, guardrails, high-risk classifier, red-team tests |
| Phase 4 | SOS khong co owner/workflow | Status lifecycle, audit log, recipient scope, student-visible status |
| Phase 5 | Bao cao aggregate tai dinh danh hoc sinh | Thresholding, aggregation, no small-cell reports, minimize export |

## Highest-Priority Roadmap Rules

1. Khong build chatbot truoc khi co safety policy, escalation rules va test cases.
2. Khong build parent/teacher dashboard truoc khi co RBAC matrix ro.
3. Khong luu transcript/chat/test answers mac dinh neu chua co muc dich, consent va retention.
4. Khong de SOS la notification don gian; phai la workflow co trang thai va audit.
5. Khong goi self-check la chan doan.
6. Khong cho nguoi lon xem nhieu hon muc can de ho tro hoc sinh.
7. Khong de API key hoac LLM provider xuat hien o frontend.
8. Khong pilot voi hoc sinh that neu chua co privacy notice, consent flow va demo/real data separation.

## Sources

- WHO adolescent mental health fact sheet: https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- OWASP Top 10 for LLM/GenAI Apps 2025: https://genai.owasp.org/llm-top-10/
- FTC Children's Privacy/COPPA guidance: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy
- Vietnam Decree 13/2023/ND-CP personal data protection: https://vanban.chinhphu.vn/
- U.S. Department of Education Student Privacy resources: https://studentprivacy.ed.gov/ferpa
- UK Department for Education mental health and behaviour in schools: https://www.gov.uk/government/publications/mental-health-and-behaviour-in-schools--2

## Gaps / Needs Deeper Research

- Legal review theo luat Viet Nam ve xu ly du lieu ca nhan nhay cam cua tre em, consent cua hoc sinh/cha me/nguoi giam ho, va trach nhiem cua truong khi nhan SOS.
- Chuyen gia tam ly/giao duc review self-check, peer-pressure scenarios va chatbot safety responses.
- Production policy can quyet dinh: co luu transcript chatbot khong, retention bao lau, ai duoc xem du lieu nao trong high-risk situation.
