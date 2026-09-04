# 🔐 SecureVault Frontend

SecureVault Frontend is a modern, responsive web application designed for secure cloud document management and access monitoring. It provides an intuitive interface for Amazon Cognito user authentication, direct-to-Amazon S3 file uploads and downloads using presigned URLs, file metadata management, and audit activity tracking.

## 🎥 Project Demo

▶️ [Watch SecureVault Project Demo](https://youtu.be/W42Mjil9OKo)

This video demonstrates the working web application interface and its core file management and access audit capabilities.

## ✨ Features

- **User Authentication & Verification**: User registration, sign-in, and email verification code confirmation powered by Amazon Cognito.
- **Secure Authenticated API Requests**: API Gateway requests authorized using Cognito ID JWT tokens in standard Bearer headers.
- **Direct S3 File Uploads**: Upload documents directly to Amazon S3 via presigned PUT URLs, bypassing API payload limitations.
- **Secure File Downloads**: Request temporary presigned GET URLs for secure, time-limited document downloads.
- **File Management & Operations**: List documents, filter by type (PDF, DOC/DOCX, Images, Other), search, sort, view file details, and delete files.
- **Audit Log Visibility**: View access activity history (Upload, Download, View, Delete) with search and filtering by action type and date.
- **Interactive Drag-and-Drop Upload**: Modern upload dropzone supporting file selection and drag-and-drop with file type and size validation.
- **Responsive Dashboard UI**: Clean layout built with modern CSS design tokens, status indicators, and dynamic UI state handling (Live API mode vs Local Demo fallback).

## ☁️ AWS Services Used

SecureVault Frontend integrates with the following cloud services across the project architecture:

- **Amazon Cognito** — Handles user identity, user pool authentication, sign-up flows, and JWT session tokens.
- **Amazon API Gateway** — Exposes REST API endpoints (`/files`, `/upload`, `/download/{fileId}`, `/audit`) protected by Cognito authorization.
- **AWS Lambda** — Executes serverless backend logic for presigned URL generation, file metadata management, and audit logging.
- **Amazon S3** — Stores private document files securely using direct presigned PUT and GET transfer URLs.
- **Amazon DynamoDB** — Persists file metadata records and access audit logs for fast, structured querying.
- **Terraform** — Provisions and manages cloud infrastructure as code (IaC).

> **Note**: This repository contains the frontend web application. The backend API handlers and Terraform infrastructure are maintained in separate repositories.

## 🏗️ Application Flow

1. User authenticates using Amazon Cognito credentials.
2. The frontend receives and stores the authenticated Cognito ID JWT token.
3. Authenticated requests are sent to Amazon API Gateway with `Authorization: Bearer <ID_TOKEN>` headers.
4. Backend AWS Lambda functions process requests and generate temporary presigned S3 URLs.
5. Files are streamed directly to/from Amazon S3 using presigned URLs.
6. File metadata and access audit records are written to and retrieved from Amazon DynamoDB.
7. The frontend dynamically renders file records, summary statistics, and access audit activity in the dashboard UI.

## 📁 Project Structure

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

## ⚙️ How It Works

1. **Authentication (`auth.js` & `index.html`)**:
   - Uses `amazon-cognito-identity-js` to handle user signup, verification code confirmation, sign-in, and sign-out against an AWS Cognito User Pool.
   - Manages user session state and retrieves valid Cognito ID JWT Tokens for API authorization.

2. **API & Direct S3 Transfers (`api.js` & `dashboard.js`)**:
   - Sends authenticated requests with `Authorization: Bearer <ID_TOKEN>` headers to AWS API Gateway endpoints.
   - **Upload**: Requests a presigned PUT URL from `POST /upload`, then streams binary data directly to S3 via HTTP `PUT` without sending raw files through the backend API.
   - **Download**: Requests a presigned GET URL from `GET /download/{fileId}` for secure, temporary document access.
   - **File Management & Audit Logs**: Fetches document metadata from `GET /files`, deletes files via `DELETE /files/{fileId}`, and retrieves access history from `GET /audit`.

3. **Configuration System (`config.template.js`, `config.js`, `config.local.js`)**:
   - `config.template.js` defines expected parameters: `apiEndpoint`, `userPoolId`, and `clientId`.
   - Local environment overrides are placed in `js/config.js` and `js/config.local.js` (which are excluded from Git).

## 🚀 Setup & Running Locally

### 1. Configure Local Environment
Copy `js/config.template.js` to `js/config.js` or `js/config.local.js` and populate your AWS configuration parameters:

```javascript
window.SECUREVAULT_CONFIG = {
  apiEndpoint: "https://<your-api-id>.execute-api.<region>.amazonaws.com/dev",
  userPoolId: "<your-cognito-user-pool-id>",
  clientId: "<your-cognito-app-client-id>"
};
```

### 2. Run Local Web Server
Serve the static frontend using Python's built-in HTTP server:

```powershell
cd securevault-frontend
py -m http.server 8080
```

### 3. Access Application
Open `http://localhost:8080/index.html` in your browser.

> **Fallback Demo Mode**: If opened directly without configured endpoints or an active backend API, the UI safely degrades to an interactive local demo state for previewing.

## 🔒 Security

- **Credential Protection**: Configuration files containing environment-specific values (`js/config.js` and `js/config.local.js`) are git-ignored to prevent committing endpoints or private credentials.
- **No AWS Keys in Frontend**: AWS IAM access keys and secret keys are never included or exposed in browser code; storage operations rely exclusively on Cognito JWT tokens and presigned URLs.
- **Authorized API Access**: All backend REST requests require a valid Cognito ID JWT token passed in standard `Authorization: Bearer <ID_TOKEN>` headers.
- **Direct Private Storage**: Document uploads and downloads use time-limited presigned URLs for direct transfer to private S3 buckets.

## 📌 Repository Structure

SecureVault is divided into three dedicated repositories:

- [`securevault-frontend`](https://github.com/mahi-8758/securevault-frontend) — Web application user interface (HTML/CSS/JS)
- [`securevault-backend`](https://github.com/mahi-8758/securevault-backend) — Serverless REST API and AWS Lambda handlers
- [`securevault-infrastructure`](https://github.com/mahi-8758/securevault-infrastructure) — Terraform Infrastructure as Code (IaC) for AWS resources

## 📄 Project Summary

SecureVault is an AWS-based secure document management web application frontend demonstrating authentication, serverless APIs, cloud storage, metadata management, and audit tracking. By integrating Amazon Cognito, API Gateway, Lambda, S3 presigned transfers, DynamoDB, and Terraform IaC, the project showcases end-to-end cloud security and serverless web architecture best practices.