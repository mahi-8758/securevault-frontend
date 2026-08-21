# SecureVault Frontend

This repository contains the unchanged vanilla HTML, CSS, and JavaScript SecureVault interface. It supports the local demo workflow for login, documents, upload, download, delete, and audit logs.

## Local development

Run the Express demo backend from `securevault-backend`, then open `index.html` through a local web server. The checked-in `js/config.local.js` points to `http://localhost:3000`; it contains no AWS credentials. The existing browser mock fallback also allows the UI to be opened directly from the filesystem.

## API configuration

Use `js/config.template.js` as the deployment template. Replace the placeholders in a local or deployment-specific config with the API endpoint and Cognito identifiers, and load that file before `api.js`. Never commit generated environment-specific configuration containing secrets.

## Future Cognito integration

`auth.js` keeps authentication behind a small public API so Cognito token handling can be added later without rewriting the dashboard. Cognito access tokens will be sent to the API, while documents will use presigned storage URLs.

AWS access keys and secret keys must never be placed in frontend code: browsers cannot protect them, and bundled JavaScript is public. Use AWS CLI profiles, environment credentials, and IAM roles on trusted infrastructure instead.