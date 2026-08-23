# SecureVault Frontend

This repository contains the vanilla HTML, CSS, and JavaScript SecureVault interface. It uses Amazon Cognito for browser authentication and keeps the document and audit workflows local until the backend integration phase.

## Local development

Start the backend in one terminal:

```powershell
cd securevault-backend
npm install
npm start
```

Start the frontend in a second terminal:

```powershell
cd securevault-frontend
py -m http.server 8080
```

Open `http://localhost:8080/index.html`. The checked-in `js/config.local.js` points to `http://localhost:3000`; it contains no AWS credentials. The Cognito CDN script requires an internet connection.

## API configuration

Use `js/config.template.js` as the deployment template. Replace the placeholders in a local or deployment-specific config with the API endpoint and Cognito identifiers, and load that file before `api.js`. Never commit generated environment-specific configuration containing secrets.

## Cognito authentication

`auth.js` owns signup, email confirmation, sign-in, sign-out, current-user lookup, session validation, and ID-token retrieval. Cognito stores its normal browser session state; passwords and tokens are not written by SecureVault code. The ID token is currently returned only through the authentication helper and is not sent to the backend.

AWS access keys and secret keys must never be placed in frontend code: browsers cannot protect them, and bundled JavaScript is public. Use AWS CLI profiles, environment credentials, and IAM roles on trusted infrastructure instead.