# Integrated Customer Service Portal

Customer-facing support ticket system for Integrated OÜ's Business Central implementation clients. Customers log in via Microsoft auth, create tickets via an AI chatbot, track existing tickets, and attach files.

## Architecture

```
Customer -> integrated.ee/support -> React SPA (GitHub Pages)
                                         |
                                    Azure Functions (middleware)
                                     |        |         |
                                BC SaaS    Claude API   Azure Blob
                                (API pages) (AI chat)   (file storage)
```

### Components

| Component | Technology | Location |
|-----------|-----------|----------|
| Frontend | React + TypeScript + Tailwind | `frontend/` |
| API Middleware | Azure Functions v4 (Node.js) | `api/` |
| BC Extension | AL Language | `bc-extension/` |

## Setup

### Prerequisites

- Node.js 20+
- Azure Functions Core Tools v4
- AL Language VS Code extension (for BC compilation)
- Azure CLI (for deployment)

### Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173/customer-service-portal/
```

### API (Azure Functions)

```bash
cd api
npm install
npm run build
func start     # http://localhost:7071/api/
```

### BC Extension

Compile:
```bash
cd bc-extension
/Users/villemheinsalu/.vscode/extensions/ms-dynamics-smb.al-*/bin/darwin/alc \
  /project:"." /packagecachepath:".alpackages" /generatereportlayout-
```

## CI/CD

### Frontend
Deployed to GitHub Pages on push to `main` (changes in `frontend/`).

### API
Deployed to Azure Functions on push to `main` (changes in `api/`).

### BC Extension
Uses AL-Go for GitHub. Builds and deploys to BC SaaS Sandbox on push to `main`.
Manual publish via `PublishToEnvironment` workflow.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Azure Functions publish profile |
| `Sandbox_AuthContext` | BC deployment auth: `{"tenantId":"...","clientId":"...","clientSecret":"..."}` |
| `SLACK_WEBHOOK_URL` | Optional: Slack notifications on deploy |

### Required GitHub Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://integrated-cs-api.azurewebsites.net/api` |
| `VITE_MSAL_CLIENT_ID` | `a3a64d19-8a8f-48c7-af9c-02a4e4960edc` |
| `VITE_MSAL_AUTHORITY` | `https://login.microsoftonline.com/7e6efb3b-5060-4666-aee5-ffe6f3cb3644` |
| `VITE_MSAL_REDIRECT_URI` | `https://integrated-ee.github.io/support/` |
| `VITE_MSAL_SCOPE` | `api://a3a64d19-8a8f-48c7-af9c-02a4e4960edc/access_as_user` |

## Environment

| Resource | Value |
|----------|-------|
| Entra ID Tenant | `7e6efb3b-5060-4666-aee5-ffe6f3cb3644` |
| BC Environment | `sandbox` |
| Azure Subscription | `39c4e93c-dcac-4a88-8a92-f63e31cac67c` |
| Function App | `integrated-cs-api.azurewebsites.net` |
| Storage Account | `integratedcsfiles` |
| GitHub Repo | `integrated-ee/customer-service-portal` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tickets | List tickets |
| GET | /api/tickets/{id} | Get ticket detail |
| POST | /api/tickets | Create ticket |
| PATCH | /api/tickets/{id} | Update ticket |
| GET | /api/tickets/{id}/comments | List comments |
| POST | /api/tickets/{id}/comments | Add comment |
| POST | /api/tickets/{id}/attachments | Upload attachment |
| GET | /api/tickets/{id}/attachments/{lineNo}/{fileName} | Download attachment |
| POST | /api/chat | AI chat for ticket intake |
| GET | /api/me | Current user info |

## BC Extension Objects

| Object | ID | Name |
|--------|----|------|
| Table | 50200 | Support Ticket |
| Table | 50201 | Ticket Comment |
| Table | 50202 | Ticket Attachment |
| Table | 50203 | Customer Portal Setup |
| Table | 50204 | Customer Email Mapping |
| Enum | 50200 | Support Ticket Status |
| Enum | 50201 | Ticket Category |
| Enum | 50202 | Ticket Priority |
| Enum | 50203 | Author Type |
| Enum | 50204 | Email Match Type |
| Page | 50200 | Support Tickets API |
| Page | 50201 | Ticket Comments API |
| Page | 50202 | Ticket Attachments API |
| Page | 50203 | Customer Portal Setup API |
| Page | 50204 | Customer Email Mapping API |
| Codeunit | 50200 | Support Ticket Mgt. |
| Codeunit | 50201 | Customer Service Install |
| Codeunit | 50202 | Customer Service Upgrade |
| PermissionSet | 50200 | Customer Service API |
