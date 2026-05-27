---
phase: 30
slug: identity-foundation-auth-contracts
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-25
---

# Phase 30 — UI Design Contract

> Visual and interaction contract for Phase 30 identity foundation surfaces. Generated from GSD UI research and verified by gsd-ui-checker.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none; reuse handmade React/Tailwind components already embedded in `frontend/app/(authenticated)/admin/operations/page.tsx` |
| Icon library | none |
| Font | project default via existing `text-body`, `text-label`, `text-heading`, `text-display` utility classes |

**Do not initialize shadcn for this phase.** Phase 30 only extends the existing admin operations dashboard with metadata-only cards and bucket lists.

---

## Existing Components to Reuse

| Component/pattern | Source | Required use |
|-------------------|--------|--------------|
| `Panel` | `frontend/app/(authenticated)/admin/operations/page.tsx` | Wrap each identity/auth operations section with `space-y-4 rounded-3xl bg-white p-6 shadow-sm`. |
| `MetricCard` | `frontend/app/(authenticated)/admin/operations/page.tsx` | Show count/status summaries only, never raw identity values. |
| `StatusBadge` | `frontend/app/(authenticated)/admin/operations/page.tsx` | Display provider/mapping/session status as visible text plus color. |
| `BucketList` | `frontend/app/(authenticated)/admin/operations/page.tsx` | Render mapping/session buckets with safe `label` + `count`. |
| Empty fallback pattern | `dashboard.field ?? []` | Every new optional array must tolerate missing Phase 30 backend fields. |
| Privacy note banner | Existing "Ranh giới riêng tư" section | Add identity-specific privacy copy without exposing sensitive values. |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline separators and compact badge gaps |
| sm | 8px | Badge groups, label/body stacking |
| md | 16px | Card internal grouping, bucket list spacing |
| lg | 24px | Existing `p-6` panel/card padding |
| xl | 32px | Grid gaps between admin sections |
| 2xl | 48px | Not required for new Phase 30 panels |
| 3xl | 64px | Page-level rhythm inherited from `space-y-6` |

Exceptions: none.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | existing `text-body` | regular | existing `text-body` line-height |
| Label | existing `text-label` | regular or `font-semibold` for field labels | existing `text-label` line-height |
| Heading | existing `text-heading` | `font-semibold` | existing `text-heading` line-height |
| Display | existing `text-display` | `font-semibold` | existing `text-display` line-height |

Do not introduce new typography utilities or additional font weights for Phase 30. The contract allows only `regular` and `font-semibold`.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | existing white surface `bg-white` | Panel and card surfaces |
| Secondary (30%) | existing `bg-secondary` and `border-[#D7EFE8]` | Nested metadata blocks and safe buckets |
| Accent (10%) | existing `text-accent`, `bg-accent`, `border-accent`, `text-accent-dark` | Section labels, passing/covered status, primary filter button only |
| Warning | existing `border-warning bg-[#FFF8E8] text-[#6B4A00]` | Provider/mapping/session warning states |
| Destructive | existing `text-red-700`, `border-[#F3C0C0]` | Denied/fail status text only; no destructive controls in this phase |

Accent reserved for: section label, passing/covered status, existing primary filter button. Do not use accent to imply provider authorization.

---

## Required UI Sections

### 1. Auth Provider Readiness Panel

**Placement:** in `AdminOperationsPage`, near existing `Runtime mode` and `Connectivity & session contract` panels.

**Primary visual anchor:** the provider readiness status badge and provider label. It must appear before mapping/session buckets so operators first understand whether external login is enabled, disabled, warning, or failing.

**Title:** `Auth provider readiness`

**Description:** `Theo dõi cấu hình đăng nhập ngoài bằng metadata an toàn, không hiển thị client ID, issuer, callback URL hoặc secret.`

**Safe data shape:**

```ts
export type AuthProviderReadinessSummary = {
  enabled: boolean;
  provider_key: string;
  provider_label: string;
  mode: string;
  status: "pass" | "warn" | "fail";
  last_check_status: string | null;
  remediation: string | null;
};
```

**Rendering contract:**

- Use a `Panel` containing one `rounded-2xl bg-secondary p-4` block.
- Show `StatusBadge` with `status`.
- Show `provider_label`, `mode`, and `enabled` only.
- `provider_key` may be shown only as a safe enum-like key such as `local`, `pilot_sso`, or `disabled`; do not show issuer/client/callback details.
- Show `last_check_status` and `remediation` only if present.
- Empty fallback copy: `Chưa có metadata nhà cung cấp đăng nhập. Hãy kiểm tra cấu hình provider và tải lại trang vận hành.`
- Error fallback remains the page-level error copy: `Chưa tải được dữ liệu vận hành. Hãy thử lại từ cổng quản trị.`

### 2. Identity Mapping Buckets Panel

**Placement:** next to session auth method metadata when viewport is `lg:grid-cols-2`, or below provider readiness on mobile.

**Title:** `Identity mapping buckets`

**Description:** `Tóm tắt trạng thái liên kết danh tính theo count metadata; không có email, subject, claim hoặc drilldown tài khoản.`

**Safe data shape:**

```ts
export type IdentityMappingOperationsSummary = {
  by_status: OperationCountBucket[];
  pending_review_count: number;
  disabled_count: number;
  deprovisioned_count: number;
};
```

**Rendering contract:**

- Use `BucketList` for `by_status ?? []`.
- Add `MetricCard` or compact count rows for:
  - `pending_review_count`
  - `disabled_count`
  - `deprovisioned_count`
- Required pending-review copy: `Một số liên kết danh tính đang chờ duyệt. Không có tài khoản nào được tự động cấp quyền.`
- Empty fallback copy: `Chưa có metadata liên kết danh tính. Không có tài khoản nào được tự động cấp quyền từ claim bên ngoài.`
- No row may link to a user, student, email address, external subject, or raw provider payload.

### 3. Session Auth Methods Panel

**Placement:** same identity/auth operations grid as mapping buckets.

**Title:** `Session auth methods`

**Description:** `Tóm tắt session backend-owned theo phương thức đăng nhập và provider an toàn; không lưu token trong trình duyệt.`

**Safe data shape:**

```ts
export type SessionAuthOperationsSummary = {
  by_auth_method: OperationCountBucket[];
  by_provider: OperationCountBucket[];
};
```

**Rendering contract:**

- Use two `BucketList` blocks:
  - title `Phương thức đăng nhập`
  - title `Provider`
- Use optional fallbacks: `dashboard.session_auth?.by_auth_method ?? []` and `dashboard.session_auth?.by_provider ?? []`.
- Empty fallback copy: `Chưa có metadata session theo phương thức đăng nhập.`
- Required explanatory copy: `Session vẫn dùng cookie HttpOnly do backend sở hữu; UI không đọc hoặc lưu access token.`

### 4. Login/Demo Capability Copy (only if implemented)

If backend exposes a public-safe auth capability endpoint or extends an existing login payload:

- Production-pilot demo disabled copy: `Demo công khai đang tắt cho production pilot. Hãy dùng tài khoản được cấp bởi quản trị viên.`
- Provider disabled copy: `Nhà cung cấp đăng nhập ngoài chưa bật cho pilot.`
- Do not render IdP issuer URLs, client IDs, callback URLs, raw domains, or support contact emails from backend payloads.
- Do not add OAuth redirect buttons in Phase 30 unless the backend implements a safe no-token contract. A disabled informational row is acceptable.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Provider readiness panel title | `Auth provider readiness` |
| Provider readiness description | `Theo dõi cấu hình đăng nhập ngoài bằng metadata an toàn, không hiển thị client ID, issuer, callback URL hoặc secret.` |
| Identity mapping panel title | `Identity mapping buckets` |
| Identity mapping description | `Tóm tắt trạng thái liên kết danh tính theo count metadata; không có email, subject, claim hoặc drilldown tài khoản.` |
| Session auth panel title | `Session auth methods` |
| Session auth description | `Tóm tắt session backend-owned theo phương thức đăng nhập và provider an toàn; không lưu token trong trình duyệt.` |
| Empty state heading | `Chưa có metadata danh tính.` |
| Empty state body | `Hãy kiểm tra cấu hình provider và tải lại trang vận hành.` |
| Error state | `Chưa tải được metadata đăng nhập. Hãy thử lại từ cổng quản trị.` |
| Pending review note | `Một số liên kết danh tính đang chờ duyệt. Không có tài khoản nào được tự động cấp quyền.` |
| Demo disabled note | `Demo công khai đang tắt cho production pilot. Hãy dùng tài khoản được cấp bởi quản trị viên.` |
| Destructive confirmation | Not applicable; Phase 30 UI must not add destructive identity controls. |

---

## Privacy and Security Redlines

Never display, log through UI metadata, add to fixtures as visible strings, or expose via table cells:

- Client IDs, client secrets, issuer URLs, callback URLs, tenant URLs, or raw provider domains.
- Raw external subject, raw email, raw claims, raw groups, school/class metadata, access tokens, refresh tokens, ID tokens, session cookie values, or password hashes.
- Per-student identity drilldowns, user/account detail links from mapping buckets, export buttons, raw JSON viewers, privileged auto-provisioning controls, or group-to-role mapping controls.
- Any copy implying provider groups or school/class metadata grant adult visibility.

Required privacy note addition:

`Danh tính ngoài chỉ được hiển thị bằng metadata tổng hợp. Quyền xem học sinh vẫn do vai trò trong ứng dụng, liên kết đang hoạt động và SOS của học sinh quyết định.`

---

## Responsive and Accessibility Contract

- Keep page wrapper `space-y-6`.
- Use single-column stacking on mobile.
- Use `grid gap-4 lg:grid-cols-2` for mapping/session panels and `md:grid-cols-3` only for compact metrics.
- Status must always be visible text, not color-only.
- Preserve semantic headings: `h2` for `Panel`, `h3` for nested cards.
- Controls added for demo capability must have accessible labels and must not become hidden-only status indicators.
- Long provider labels must wrap; do not use `break-all` for provider labels unless they are safe enum keys.

---

## Type and Fallback Contract

`frontend/lib/admin-operations-api.ts` must add optional Phase 30 fields to preserve compatibility with older Phase 11/25/29 fixtures:

```ts
auth_provider?: AuthProviderReadinessSummary | null;
identity_mappings?: IdentityMappingOperationsSummary | null;
session_auth?: SessionAuthOperationsSummary | null;
```

Every renderer must use nullish fallbacks:

```ts
dashboard.identity_mappings?.by_status ?? []
dashboard.session_auth?.by_auth_method ?? []
dashboard.session_auth?.by_provider ?? []
```

Do not require Phase 30 fields in existing test fixtures unless the test specifically covers Phase 30.

---

## Test Expectations

Frontend tests must verify:

- `getAdminOperationsDashboard()` still calls `apiFetch` with `credentials: "include"` and does not write to `localStorage` or `sessionStorage`.
- Operations page renders provider readiness, identity mapping, and session auth buckets from safe metadata.
- Existing fixtures without Phase 30 fields still render without throwing.
- Rendered text does not contain forbidden values such as `client_secret`, `issuer_url`, `callback_url`, `raw_subject`, `raw_email`, `access_token`, `refresh_token`, `id_token`, `RAW_`, `export`, `drilldown`, or a fixture email address.
- Pending-review copy states that no account is automatically granted privileges.
- Any login/demo capability copy hides demo entry in production pilot without exposing provider internals.

Suggested test files:

- Extend `frontend/tests/phase11-operations-ui.test.tsx` or add `frontend/tests/phase30-identity-operations-ui.test.tsx`.
- Keep no-token coverage in `frontend/tests/no-token-storage.test.ts`.
- If login capability copy is added, extend `frontend/tests/auth-portals.test.tsx`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | blocked; do not add third-party UI blocks for Phase 30 |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

