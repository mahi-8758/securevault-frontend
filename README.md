# SecureVault Frontend

SecureVault Frontend is a modern, responsive web application for secure document management, user authentication, direct-to-S3 presigned file uploading and downloading, and access audit tracking.

## Directory Tree

```text
securevault-frontend/
├── css/
│   └── style.css            # Custom CSS design system, theme tokens, and responsive layout styles
├── js/
│   ├── api.js               # Centralized API service layer (fetch client & auth token headers)
│   ├── auth.js              # Amazon Cognito Identity JS auth helper (signup, confirm, login, logout)
│   ├── config.js            # Environment Cognito config (UserPoolId, ClientId, Region) [git-ignored]
│   ├── config.local.js      # Local API Gateway endpoint configuration override [git-ignored]
│   ├── config.template.js   # Production deployment configuration template
│   └── dashboard.js         # Core UI interaction controller (file grid, drag-drop upload, audit table)
├── .gitignore               # Frontend Git ignore rules (protects credentials, configs, and payloads)
├── dashboard.html           # Main user vault dashboard interface
├── index.html               # Authentication landing page (Sign In / Sign Up / Verification)
└── README.md                # Frontend documentation
```

## How It Works

1. **Authentication (`auth.js` & `index.html`)**:
   - Uses `amazon-cognito-identity-js` to handle user signup, verification code confirmation, sign-in, and sign-out against AWS Cognito User Pool.
   - Manages user session state and retrieves valid Cognito ID JWT Tokens for API authorization.

2. **API & Direct S3 Transfers (`api.js` & `dashboard.js`)**:
   - Sends authenticated requests with `Authorization: Bearer <ID_TOKEN>` headers to AWS API Gateway endpoints.
   - **Upload**: Requests a presigned PUT URL from `/upload`, then streams the binary file directly to S3 without sending raw files through the backend API.
   - **Download**: Requests a presigned GET URL from `/download/{fileId}` for secure, temporary document access.
   - **File Management & Audit Logs**: Fetches document metadata from `/files` and access history from `/audit`.

3. **Configuration System**:
   - `config.template.js` defines the expected parameters: `apiEndpoint`, `userPoolId`, and `clientId`.
   - Local overrides are placed in `js/config.js` and `js/config.local.js` (which are excluded from git).

## Setup & Running Locally

### Option 1: Live API Mode (Connected to AWS / Local Backend)
1. Copy `js/config.template.js` to `js/config.js` or `js/config.local.js`:
   ```javascript
   window.SECUREVAULT_CONFIG = {
     apiEndpoint: "https://<your-api-id>.execute-api.<region>.amazonaws.com/dev",
     userPoolId: "<your-cognito-user-pool-id>",
     clientId: "<your-cognito-app-client-id>"
   };
   ```
2. Serve the static frontend using a local web server:
   ```powershell
   cd securevault-frontend
   py -m http.server 8080
   ```
3. Open `http://localhost:8080/index.html` in your browser.

### Option 2: Fallback Demo Mode
If opened directly or without configured endpoints, the UI safely degrades to local interactive demo state for UI previewing.

## Security Best Practices
- Never commit `js/config.js` or `js/config.local.js` containing real environment endpoints or AWS identifiers to Git.
- Browsers only store Cognito user session tokens; AWS IAM access/secret keys are never included in frontend code.