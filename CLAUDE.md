# Integrated Customer Service Portal

Customer-facing support ticket system for Integrated OÜ's BC implementation clients.

## Architecture

```
Customer -> React SPA (GitHub Pages) -> Azure Functions -> BC SaaS (API pages)
                                            |                  |
                                        Claude API         Azure Blob Storage
                                        (AI chat)          (file attachments)
```

### Three Components

| Component | Path | Technology |
|-----------|------|-----------|
| Frontend | `frontend/` | React + TypeScript + Tailwind + MSAL.js |
| API Middleware | `api/` | Azure Functions v4 (Node.js/TypeScript) |
| BC Extension | `bc-extension/` | AL Language, BC SaaS |

## Entra ID Configuration

| Resource | App ID | Object ID |
|----------|--------|-----------|
| Frontend SPA ("Integrated Customer Service") | `a3a64d19-8a8f-48c7-af9c-02a4e4960edc` | `44fd0a95-df64-4656-8e4e-cf32f137effa` |
| Backend ("Integrated CS Backend") | `1dd44e1a-2de9-4a91-b8b3-f9a1e17edee6` | `d90f470f-d7c8-49d5-88b2-3cc485f3349f` |
| Admin Security Group | `b8ea45ff-9e33-4375-b8cd-c5083d703223` | — |

- Tenant: `7e6efb3b-5060-4666-aee5-ffe6f3cb3644`
- Frontend exposes scope: `api://a3a64d19-8a8f-48c7-af9c-02a4e4960edc/access_as_user`
- Frontend has SPA redirects: `http://localhost:5173/customer-service-portal/`, `https://integrated-ee.github.io/customer-service-portal/`
- Backend has BC API.ReadWrite.All (app permission, admin consented)
- Backend has web redirect: `https://businesscentral.dynamics.com/OAuthLanding.htm` (for BC consent)
- Group claims included in ID and access tokens

## Azure Resources

| Resource | Value |
|----------|-------|
| Subscription | `39c4e93c-dcac-4a88-8a92-f63e31cac67c` (Microsoft Azure Sponsorship) |
| Resource Group | `rg-customer-service` (North Europe) |
| Storage Account | `integratedcsfiles` |
| Blob Container | `ticket-attachments` |
| Function App | `integrated-cs-api` (`integrated-cs-api.azurewebsites.net`) |
| GitHub Repo | `integrated-ee/customer-service-portal` |

## BC SaaS Environment

| Property | Value |
|----------|-------|
| Environment | `sandbox` |
| Version | 27.3 (2025 wave 2) |
| Company | `Integrated Technologies OÜ` |
| Company ID | `809f14f8-f71b-ef11-9f88-000d3ab86703` |
| Country | EE (Estonian) |

### BC Extension Details

**App ID**: `7f3a6686-06e3-4168-81c2-11a76cae2929`
**Publisher**: Integrated OÜ
**ID Range**: 50200-50249

| Object | ID | Name |
|--------|----|------|
| Table | 50200 | Support Ticket |
| Table | 50201 | Ticket Comment |
| Table | 50202 | Ticket Attachment |
| Table | 50203 | Customer Portal Setup |
| Table | 50204 | Customer Email Mapping |
| Enum | 50200 | Support Ticket Status (New, In Progress, Resolved, Closed) |
| Enum | 50201 | Ticket Category (Bug, Question, Feature Request, Other) |
| Enum | 50202 | Ticket Priority (Low, Medium, High, Critical) |
| Enum | 50203 | Author Type (Customer, Admin, System) |
| Enum | 50204 | Email Match Type (Exact, Domain) |
| Page | 50200 | Support Tickets API |
| Page | 50201 | Ticket Comments API |
| Page | 50202 | Ticket Attachments API |
| Page | 50203 | Customer Portal Setup API |
| Page | 50204 | Customer Email Mapping API |
| Codeunit | 50200 | Support Ticket Mgt. |
| Codeunit | 50201 | Customer Service Install |
| Codeunit | 50202 | Customer Service Upgrade |
| PermissionSet | 50200 | Customer Service API |

### BC Entra App Setup

The backend app (`1dd44e1a-2de9-4a91-b8b3-f9a1e17edee6`) must be registered in BC:
1. Go to **Microsoft Entra Applications** page (9860) in BC
2. Add the Client ID
3. Set State = Enabled
4. Grant Consent
5. Assign permission sets: **D365 BUS FULL ACCESS**, **LOGIN**, **Customer Service API**

### BC API Endpoints

Base: `https://api.businesscentral.dynamics.com/v2.0/{tenantId}/{environment}/api/integrated/customerService/v1.0/companies({companyId})/`

- `supportTickets` — CRUD, with nested `ticketComments` and `ticketAttachments`
- `ticketComments` — CRUD
- `ticketAttachments` — CRUD (metadata only, files in Azure Blob)
- `customerPortalSetup` — Setup singleton
- `customerEmailMappings` — Maps email/domain to BC Customer No.

### Customer Email Mapping

The `Customer Email Mapping` table links portal users to BC customers:
- **Match Type = Exact**: email must match exactly
- **Match Type = Domain**: email domain portion must match (e.g., `fractory.com` → Customer C00010)

The middleware calls this API to resolve authenticated user email → customer number.

## Compiling BC Extension

```bash
cd bc-extension
/Users/villemheinsalu/.vscode/extensions/ms-dynamics-smb.al-*/bin/darwin/alc \
  /project:"." /packagecachepath:".alpackages" /generatereportlayout-
```

## Deploying BC Extension to SaaS

Uses the BC Automation API (3-step process):
1. POST `extensionUpload` → get upload ID
2. PATCH `extensionUpload({id})/extensionContent` with .app file
3. POST `extensionUpload({id})/Microsoft.NAV.upload` to trigger install

Auth: user token via `az account get-access-token --resource https://api.businesscentral.dynamics.com`

## Running Locally

### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173/customer-service-portal/
```

### API (Azure Functions)
```bash
cd api
npm install
npm run build
func start  # http://localhost:7071/api/
```

### Environment Files
- `frontend/.env` — MSAL config, API URL
- `api/local.settings.json` — BC credentials, Anthropic key, storage, Entra config
- `.env` (root) — Master reference of all IDs and secrets

All env files are gitignored.

## Test Users

| User | UPN | Role | Customer |
|------|-----|------|----------|
| Villem Heinsalu | villem@integrated.ee | Admin | — |
| Test Fractory | test.fractory@integratedee.onmicrosoft.com | Customer | C00010 (Fractory) |
| Test Acme | test.acme@integratedee.onmicrosoft.com | Customer | C00020 (Acme Corp) |

Password for test users: `TestPass123!`

Admin users are members of the "Integrated Support Admins" group (`b8ea45ff-9e33-4375-b8cd-c5083d703223`).

## Auth Flow

1. User opens frontend → MSAL redirects to Microsoft login
2. After sign-in, frontend acquires access token with scope `api://{clientId}/access_as_user`
3. Frontend sends Bearer token to Azure Functions
4. Azure Functions validates JWT via Entra ID JWKS
5. Checks `groups` claim for admin group membership
6. Calls BC API using client credentials (backend app) to resolve customer and fetch data
7. Returns filtered data (customers see only their tickets, admins see all)

## AI Chat Flow

1. User types in chat UI → messages sent to POST `/api/chat`
2. Azure Functions sends conversation to Claude API with system prompt
3. Claude gathers issue details through conversation
4. When enough info gathered, Claude returns JSON with `{subject, description, category, priority}`
5. Frontend shows confirmation card → user clicks "Create Ticket"
6. POST `/api/tickets` creates the ticket in BC

## Key Design Decisions

- **BC as source of truth**: All ticket data lives in BC tables. Azure Blob only for file content.
- **Client credentials for BC**: Middleware uses app-to-app auth, no user delegation needed.
- **Email mapping in BC**: Customer resolution is a BC concern, not middleware config.
- **No. Series auto-init**: OnInsert trigger auto-creates setup + No. Series if missing.
- **Stateless chat**: Frontend sends full conversation history each request — no server-side sessions.
