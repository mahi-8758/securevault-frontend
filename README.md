# 🔐 SecureVault — AWS Secure File Management Frontend

<p align="center">
  <strong>A secure, serverless cloud file management web application built with AWS</strong>
</p>

<p align="center">
  <a href="https://youtu.be/W42Mjil9OKo">🎥 Live Demo</a> •
  <a href="https://github.com/mahi-8758/securevault-backend">Backend</a> •
  <a href="https://github.com/mahi-8758/securevault-infrastructure">Infrastructure</a>
</p>

---

## 📌 Overview

**SecureVault** is a secure, responsive cloud-based file management application that allows authenticated users to upload, view, download, delete, and manage documents while maintaining a complete audit trail of file-related activities.

The frontend is built using **HTML, CSS, and JavaScript** and integrates with AWS through a serverless REST API.

Authentication is handled by **Amazon Cognito**, API requests are processed through **Amazon API Gateway and AWS Lambda**, files are stored privately in **Amazon S3**, and metadata and audit records are maintained in **Amazon DynamoDB**.

The project follows a three-repository architecture:

- 🎨 Frontend — User interface
- ⚙️ Backend — Serverless API and Lambda functions
- 🏗️ Infrastructure — AWS resources managed using Terraform

---

## 🎥 Project Demo

<p align="center">
  <a href="https://youtu.be/W42Mjil9OKo"><strong>▶️ Watch the SecureVault Demo</strong></a>
</p>

The demo demonstrates user authentication, email verification, file upload, file management, downloads, deletion, and audit logging.

---

## 🌐 Live Application

**Frontend:** https://securevault-frontend-one.vercel.app/

The frontend is deployed on **Vercel** and communicates with the AWS backend through API Gateway.

---

# 🏗️ AWS Architecture

<p align="center">
  <img
    src="https://github.com/mahi-8758/securevault-frontend/blob/main/structure.jpg"
    alt="SecureVault AWS Architecture"
    width="1000"
  />
</p>

<p align="center"><em>High-level AWS architecture of SecureVault</em></p>

### Architecture Flow

```text
User
  │
  ▼
Vercel Frontend
(HTML / CSS / JS)
  │
  ├──────────────► Amazon Cognito
  │                  │
  │                  └── JWT ID Token
  │
  ▼
Amazon API Gateway
       │
       ▼
   AWS Lambda
       │
       ├──────────────► Amazon S3
       │                 Private File Storage
       │
       └──────────────► Amazon DynamoDB
                         File Metadata
                         + Audit Logs
```

---

# ✨ Features

### 🔐 Authentication
- User registration
- Email verification
- Secure sign-in and sign-out
- Cognito session management
- JWT-based API authorization

### 📁 File Management
- Upload files
- View file details
- Download files
- Delete files
- Search and sort files
- Filter by file type

### ☁️ Secure Cloud Storage
- Private Amazon S3 storage
- Temporary presigned URLs
- Direct browser-to-S3 uploads
- Direct S3 downloads
- No AWS access keys exposed in frontend code

### 📊 Audit Logging
Tracks:
- `UPLOAD`
- `VIEW`
- `DOWNLOAD`
- `DELETE`

### 🖱️ Modern UI
- Responsive dashboard
- Drag-and-drop upload
- File validation
- Search and filtering
- Dynamic statistics
- Interactive audit table

---

# ☁️ AWS Services

| Service | Purpose |
|---|---|
| **Amazon Cognito** | Authentication and JWT tokens |
| **Amazon API Gateway** | REST API endpoints |
| **AWS Lambda** | Serverless backend processing |
| **Amazon S3** | Private file storage |
| **Amazon DynamoDB** | File metadata and audit logs |
| **IAM** | Permissions and execution roles |
| **Terraform** | Infrastructure as Code |

---

# 🔄 Application Workflow

### 1. Authentication

```text
User → Frontend → Amazon Cognito → JWT ID Token
```

### 2. Authenticated API Requests

The frontend sends the Cognito token with protected requests:

```http
Authorization: Bearer <ID_TOKEN>
```

### 3. Upload

```text
Frontend
   ↓
POST /upload
   ↓
API Gateway
   ↓
Upload Lambda
   ↓
Presigned S3 PUT URL
   ↓
Frontend → Amazon S3
```

The file is uploaded directly to S3 rather than passing the file through Lambda.

### 4. Download

```text
Frontend
   ↓
GET /download/{fileId}
   ↓
API Gateway
   ↓
Download Lambda
   ↓
Presigned S3 GET URL
   ↓
Frontend → Amazon S3
```

### 5. File Management

```text
GET     /files
GET     /files/{fileId}
DELETE  /files/{fileId}
```

### 6. Audit Logging

```text
Upload / View / Download / Delete
              ↓
           Backend
              ↓
           DynamoDB
              ↓
        Audit Dashboard
```

---

# 🔌 API Integration

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/upload` | Generate presigned upload URL |
| `GET` | `/files` | List user's files |
| `GET` | `/files/{fileId}` | View file details |
| `DELETE` | `/files/{fileId}` | Delete a file |
| `GET` | `/download/{fileId}` | Generate download URL |
| `GET` | `/audit` | Retrieve audit logs |

Protected requests use:

```http
Authorization: Bearer <ID_TOKEN>
```

---

# 🛠️ Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Fetch API
- Responsive UI

### Authentication
- Amazon Cognito
- `amazon-cognito-identity-js`
- JWT

### Cloud
- Amazon API Gateway
- AWS Lambda
- Amazon S3
- Amazon DynamoDB
- IAM

### Infrastructure & Deployment
- Terraform
- Vercel

---

# 📁 Project Structure

```text
securevault-frontend/
│
├── css/
│   └── style.css
│
├── js/
│   ├── api.js
│   ├── auth.js
│   ├── config.js
│   ├── config.local.js
│   ├── config.template.js
│   └── dashboard.js
│
├── dashboard.html
├── index.html
├── .gitignore
└── README.md
```

| File | Purpose |
|---|---|
| `index.html` | Authentication page |
| `dashboard.html` | Main SecureVault dashboard |
| `style.css` | UI and responsive styling |
| `api.js` | API communication layer |
| `auth.js` | Cognito authentication |
| `dashboard.js` | Dashboard and file operations |
| `config.js` | Environment configuration |
| `config.local.js` | Local API configuration |
| `config.template.js` | Configuration template |

---

# ⚙️ Local Setup

## 1. Clone the Repository

```bash
git clone https://github.com/mahi-8758/securevault-frontend.git
cd securevault-frontend
```

## 2. Configure AWS Settings

Use `js/config.template.js` to create your local configuration:

```javascript
window.SECUREVAULT_CONFIG = {
  apiEndpoint: "https://<api-id>.execute-api.<region>.amazonaws.com/dev",
  userPoolId: "<cognito-user-pool-id>",
  clientId: "<cognito-app-client-id>"
};
```

### Required Values

| Parameter | Description |
|---|---|
| `apiEndpoint` | API Gateway endpoint |
| `userPoolId` | Cognito User Pool ID |
| `clientId` | Cognito App Client ID |

**Do not commit environment-specific configuration files containing sensitive values.**

## 3. Run Locally

```powershell
py -m http.server 8080
```

Open:

```text
http://localhost:8080
```

---

# 🔒 Security

### No AWS Credentials in Browser

The frontend does not contain AWS IAM access keys or secret keys.

```text
Browser
   │ Cognito JWT
   ▼
API Gateway
   ▼
Lambda
   ▼
AWS Services
```

### JWT Authentication

Protected API requests require a valid Cognito ID token.

### Presigned URLs

Temporary S3 presigned URLs are used for controlled file uploads and downloads.

### Private Storage

Files are stored in private S3 storage and accessed through authorized presigned operations.

### Audit Trail

File activities are recorded for visibility and accountability.

---

# 🧩 Related Repositories

### 🎨 Frontend
https://github.com/mahi-8758/securevault-frontend

### ⚙️ Backend
https://github.com/mahi-8758/securevault-backend

### 🏗️ Infrastructure
https://github.com/mahi-8758/securevault-infrastructure

---

# 🎯 Project Objectives

SecureVault demonstrates practical implementation of:

- Serverless cloud architecture
- Secure authentication
- REST API development
- Cloud file storage
- Presigned URL architecture
- NoSQL database management
- Audit logging
- Infrastructure as Code
- Frontend-to-cloud integration
- AWS security practices

---

# 📚 What I Learned

- Designing serverless AWS architectures
- Implementing Amazon Cognito authentication
- Working with API Gateway and Lambda
- Using S3 presigned URLs
- Designing DynamoDB data models
- Implementing ownership-based access control
- Building audit logging systems
- Managing infrastructure with Terraform
- Connecting a static frontend to cloud APIs
- Debugging authentication and CORS issues
- Deploying a static frontend with Vercel

---

# 🚀 Future Improvements

- File sharing between users
- Role-based access control
- Folder organization
- File previews
- Version history
- Advanced search
- Improved monitoring
- CI/CD automation

---

# 👨‍💻 Author

**Mahi Gupta**

SecureVault is an AWS cloud project demonstrating secure serverless application architecture and practical cloud engineering concepts.

---

# ⭐ Project Links

| Resource | Link |
|---|---|
| 🎨 Frontend | https://github.com/mahi-8758/securevault-frontend |
| ⚙️ Backend | https://github.com/mahi-8758/securevault-backend |
| 🏗️ Infrastructure | https://github.com/mahi-8758/securevault-infrastructure |
| 🎥 Demo Video | https://youtu.be/W42Mjil9OKo |
| 🌐 Live Frontend | https://securevault-frontend-one.vercel.app/ |

---

<p align="center">
  <strong>🔐 SecureVault — Secure Files. Serverless Architecture. Cloud Native.</strong>
</p>
