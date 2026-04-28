# Labour Management System — API Documentation

**Base URL:** `http://localhost:3000/api/v1`  
**Version:** 1.0.0  
**Stack:** Node.js, Express  
**Auth:** OTP-based (Phone Number)

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Auth APIs](#auth-apis)
3. [User APIs](#user-apis)
4. [Worker APIs](#worker-apis)
5. [Employer APIs](#employer-apis)
6. [Job APIs](#job-apis)
7. [Review APIs](#review-apis)
8. [Common Errors](#common-errors)

---

## Authentication Flow

OTP-based authentication works in two steps:

1. **Send OTP** — Client sends the user's phone number. Server generates and sends a 6-digit OTP via SMS.
2. **Verify OTP** — Client submits the phone number + OTP. Server validates and returns a JWT token.
3. **Authenticated Requests** — Client includes the JWT token in the `Authorization` header for all protected routes.

```
[Client] --POST /send-otp (phone)--> [Server] --SMS OTP--> [User's Phone]
[Client] --POST /verify-otp (phone + otp)--> [Server] --JWT Token--> [Client]
[Client] --GET /me (Bearer token)--> [Server] --User Data--> [Client]
```

> Token format: `Bearer <jwt_token>`  
> Token expiry: 7 days (configurable)

---

## Auth APIs

### 1. Send OTP

**POST** `/api/v1/users/send-otp`

Sends a 6-digit OTP to the provided phone number via SMS.

**Headers**

| Key            | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

**Request Body**

```json
{
  "phone": "9876543210"
}
```

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "OTP sent successfully to 9876543210"
}
```

**Error Responses**

`400 Bad Request` — Missing or invalid phone number

```json
{
  "success": false,
  "message": "Valid 10-digit phone number is required"
}
```

`429 Too Many Requests` — OTP request limit exceeded

```json
{
  "success": false,
  "message": "Too many OTP requests. Please try again after 10 minutes"
}
```

---

### 2. Verify OTP

**POST** `/api/v1/users/verify-otp`

Verifies the OTP and returns a JWT token. Creates a new user account if the phone number is not registered.

**Headers**

| Key            | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |

**Request Body**

```json
{
  "phone": "9876543210",
  "otp": "482910"
}
```

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_01HX9K2M3N",
    "phone": "9876543210",
    "isNewUser": false
  }
}
```

**Error Responses**

`400 Bad Request` — OTP missing

```json
{
  "success": false,
  "message": "Phone number and OTP are required"
}
```

`401 Unauthorized` — Wrong OTP

```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

`410 Gone` — OTP expired

```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one"
}
```

---

## User APIs

### 3. Get Current User

**GET** `/api/v1/users/me`

Returns the profile of the currently authenticated user.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |

**Request Body** — None

**Success Response** `200 OK`

```json
{
  "success": true,
  "user": {
    "id": "usr_01HX9K2M3N",
    "phone": "9876543210",
    "name": "Ramesh Kumar",
    "role": "worker",
    "createdAt": "2024-03-15T10:30:00.000Z"
  }
}
```

**Error Responses**

`401 Unauthorized` — Token missing or invalid

```json
{
  "success": false,
  "message": "Unauthorized. Please login to continue"
}
```

---

## Worker APIs

### 4. Create Worker Profile

**POST** `/api/v1/worker`

Creates a worker profile for the authenticated user.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |
| `Content-Type`  | `application/json`   |

**Request Body**

```json
{
  "name": "Ramesh Kumar",
  "skills": ["Plumbing", "Electrical"],
  "experience": 5,
  "location": "Pune, Maharashtra",
  "dailyRate": 700,
  "availability": true,
  "languages": ["Hindi", "Marathi"]
}
```

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Worker profile created successfully",
  "worker": {
    "id": "wrk_02JY7L4P5Q",
    "userId": "usr_01HX9K2M3N",
    "name": "Ramesh Kumar",
    "skills": ["Plumbing", "Electrical"],
    "experience": 5,
    "location": "Pune, Maharashtra",
    "dailyRate": 700,
    "availability": true,
    "languages": ["Hindi", "Marathi"],
    "rating": null,
    "createdAt": "2024-03-15T11:00:00.000Z"
  }
}
```

**Error Responses**

`400 Bad Request` — Validation failed

```json
{
  "success": false,
  "message": "Name, skills, and location are required"
}
```

`409 Conflict` — Profile already exists

```json
{
  "success": false,
  "message": "Worker profile already exists for this user"
}
```

---

### 5. Get All Workers

**GET** `/api/v1/worker`

Returns a list of all registered workers. Supports optional query filters.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |

**Query Parameters (optional)**

| Param       | Type    | Description                       |
| ----------- | ------- | --------------------------------- |
| `skill`     | string  | Filter by skill (e.g. `Plumbing`) |
| `location`  | string  | Filter by city/state              |
| `available` | boolean | Filter by availability            |
| `page`      | number  | Page number (default: 1)          |
| `limit`     | number  | Results per page (default: 10)    |

**Success Response** `200 OK`

```json
{
  "success": true,
  "total": 2,
  "page": 1,
  "workers": [
    {
      "id": "wrk_02JY7L4P5Q",
      "name": "Ramesh Kumar",
      "skills": ["Plumbing", "Electrical"],
      "location": "Pune, Maharashtra",
      "dailyRate": 700,
      "availability": true,
      "rating": 4.5
    },
    {
      "id": "wrk_03KZ8M5R6S",
      "name": "Suresh Yadav",
      "skills": ["Carpentry"],
      "location": "Mumbai, Maharashtra",
      "dailyRate": 850,
      "availability": false,
      "rating": 4.2
    }
  ]
}
```

---

### 6. Get Worker by ID

**GET** `/api/v1/worker/:id`

Returns full profile details of a specific worker.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |

**URL Params**

| Param | Type   | Description |
| ----- | ------ | ----------- |
| `id`  | string | Worker ID   |

**Success Response** `200 OK`

```json
{
  "success": true,
  "worker": {
    "id": "wrk_02JY7L4P5Q",
    "name": "Ramesh Kumar",
    "skills": ["Plumbing", "Electrical"],
    "experience": 5,
    "location": "Pune, Maharashtra",
    "dailyRate": 700,
    "availability": true,
    "languages": ["Hindi", "Marathi"],
    "rating": 4.5,
    "totalReviews": 12,
    "createdAt": "2024-03-15T11:00:00.000Z"
  }
}
```

**Error Responses**

`404 Not Found`

```json
{
  "success": false,
  "message": "Worker not found"
}
```

---

## Employer APIs

### 7. Create Employer Profile

**POST** `/api/v1/employer`

Creates an employer profile for the authenticated user.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |
| `Content-Type`  | `application/json`   |

**Request Body**

```json
{
  "companyName": "Sharma Constructions Pvt. Ltd.",
  "contactPerson": "Anil Sharma",
  "location": "Nagpur, Maharashtra",
  "industry": "Construction",
  "description": "Mid-size construction firm working on residential projects"
}
```

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Employer profile created successfully",
  "employer": {
    "id": "emp_04LA9N6T7U",
    "userId": "usr_05MB0O7V8W",
    "companyName": "Sharma Constructions Pvt. Ltd.",
    "contactPerson": "Anil Sharma",
    "location": "Nagpur, Maharashtra",
    "industry": "Construction",
    "createdAt": "2024-03-16T09:00:00.000Z"
  }
}
```

**Error Responses**

`409 Conflict`

```json
{
  "success": false,
  "message": "Employer profile already exists for this user"
}
```

---

### 8. Get All Employers

**GET** `/api/v1/employer`

Returns a list of all registered employers.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |

**Success Response** `200 OK`

```json
{
  "success": true,
  "total": 1,
  "employers": [
    {
      "id": "emp_04LA9N6T7U",
      "companyName": "Sharma Constructions Pvt. Ltd.",
      "contactPerson": "Anil Sharma",
      "location": "Nagpur, Maharashtra",
      "industry": "Construction"
    }
  ]
}
```

---

## Job APIs

### 9. Create Job

**POST** `/api/v1/jobs`

Posts a new job listing. Only accessible by employers.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |
| `Content-Type`  | `application/json`   |

**Request Body**

```json
{
  "title": "Plumber Required for Site Work",
  "description": "Need an experienced plumber for a 2-week residential project in Pune.",
  "skillsRequired": ["Plumbing"],
  "location": "Pune, Maharashtra",
  "dailyWage": 750,
  "duration": "2 weeks",
  "startDate": "2024-04-01",
  "slots": 2
}
```

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Job posted successfully",
  "job": {
    "id": "job_06NC1P8X9Y",
    "employerId": "emp_04LA9N6T7U",
    "title": "Plumber Required for Site Work",
    "description": "Need an experienced plumber for a 2-week residential project in Pune.",
    "skillsRequired": ["Plumbing"],
    "location": "Pune, Maharashtra",
    "dailyWage": 750,
    "duration": "2 weeks",
    "startDate": "2024-04-01",
    "slots": 2,
    "status": "open",
    "createdAt": "2024-03-17T08:00:00.000Z"
  }
}
```

**Error Responses**

`403 Forbidden` — Non-employer trying to post

```json
{
  "success": false,
  "message": "Only employers can post jobs"
}
```

`400 Bad Request`

```json
{
  "success": false,
  "message": "Title, location, and dailyWage are required"
}
```

---

### 10. Get All Jobs

**GET** `/api/v1/jobs`

Returns all active job listings. Supports optional filters.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |

**Query Parameters (optional)**

| Param      | Type   | Description                          |
| ---------- | ------ | ------------------------------------ |
| `skill`    | string | Filter by required skill             |
| `location` | string | Filter by location                   |
| `status`   | string | `open` or `closed` (default: `open`) |
| `page`     | number | Page number (default: 1)             |
| `limit`    | number | Results per page (default: 10)       |

**Success Response** `200 OK`

```json
{
  "success": true,
  "total": 1,
  "page": 1,
  "jobs": [
    {
      "id": "job_06NC1P8X9Y",
      "title": "Plumber Required for Site Work",
      "location": "Pune, Maharashtra",
      "dailyWage": 750,
      "skillsRequired": ["Plumbing"],
      "duration": "2 weeks",
      "startDate": "2024-04-01",
      "slots": 2,
      "status": "open"
    }
  ]
}
```

---

### 11. Get Job by ID

**GET** `/api/v1/jobs/:id`

Returns full details of a specific job listing.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |

**URL Params**

| Param | Type   | Description |
| ----- | ------ | ----------- |
| `id`  | string | Job ID      |

**Success Response** `200 OK`

```json
{
  "success": true,
  "job": {
    "id": "job_06NC1P8X9Y",
    "employerId": "emp_04LA9N6T7U",
    "employer": {
      "companyName": "Sharma Constructions Pvt. Ltd.",
      "contactPerson": "Anil Sharma"
    },
    "title": "Plumber Required for Site Work",
    "description": "Need an experienced plumber for a 2-week residential project in Pune.",
    "skillsRequired": ["Plumbing"],
    "location": "Pune, Maharashtra",
    "dailyWage": 750,
    "duration": "2 weeks",
    "startDate": "2024-04-01",
    "slots": 2,
    "status": "open",
    "createdAt": "2024-03-17T08:00:00.000Z"
  }
}
```

**Error Responses**

`404 Not Found`

```json
{
  "success": false,
  "message": "Job not found"
}
```

---

## Review APIs

### 12. Create Review

**POST** `/api/v1/reviews`

Submits a review for a worker after job completion.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |
| `Content-Type`  | `application/json`   |

**Request Body**

```json
{
  "workerId": "wrk_02JY7L4P5Q",
  "jobId": "job_06NC1P8X9Y",
  "rating": 5,
  "comment": "Ramesh did excellent work. Very punctual and professional."
}
```

**Success Response** `201 Created`

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "id": "rev_07OD2Q9Z0A",
    "workerId": "wrk_02JY7L4P5Q",
    "employerId": "emp_04LA9N6T7U",
    "jobId": "job_06NC1P8X9Y",
    "rating": 5,
    "comment": "Ramesh did excellent work. Very punctual and professional.",
    "createdAt": "2024-03-20T14:00:00.000Z"
  }
}
```

**Error Responses**

`400 Bad Request` — Rating out of range

```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

`409 Conflict` — Already reviewed

```json
{
  "success": false,
  "message": "You have already reviewed this worker for this job"
}
```

---

### 13. Get All Reviews

**GET** `/api/v1/reviews`

Returns all reviews. Supports filtering by worker or job.

**Headers**

| Key             | Value                |
| --------------- | -------------------- |
| `Authorization` | `Bearer <jwt_token>` |

**Query Parameters (optional)**

| Param      | Type   | Description              |
| ---------- | ------ | ------------------------ |
| `workerId` | string | Filter reviews by worker |
| `jobId`    | string | Filter reviews by job    |

**Success Response** `200 OK`

```json
{
  "success": true,
  "total": 1,
  "reviews": [
    {
      "id": "rev_07OD2Q9Z0A",
      "workerId": "wrk_02JY7L4P5Q",
      "workerName": "Ramesh Kumar",
      "employerCompany": "Sharma Constructions Pvt. Ltd.",
      "jobTitle": "Plumber Required for Site Work",
      "rating": 5,
      "comment": "Ramesh did excellent work. Very punctual and professional.",
      "createdAt": "2024-03-20T14:00:00.000Z"
    }
  ]
}
```

---

## Common Errors

These errors can occur across any endpoint.

| Status Code | Error                 | Meaning                                              |
| ----------- | --------------------- | ---------------------------------------------------- |
| `400`       | Bad Request           | Missing or invalid fields in the request body        |
| `401`       | Unauthorized          | JWT token is missing, expired, or invalid            |
| `403`       | Forbidden             | Authenticated but not allowed to perform this action |
| `404`       | Not Found             | The requested resource does not exist                |
| `409`       | Conflict              | Resource already exists (duplicate entry)            |
| `410`       | Gone                  | OTP has expired                                      |
| `429`       | Too Many Requests     | Rate limit exceeded (OTP or API calls)               |
| `500`       | Internal Server Error | Unexpected server-side error                         |

**Generic 500 Response**

```json
{
  "success": false,
  "message": "Something went wrong. Please try again later"
}
```

---

> For questions or issues, contact the backend team or raise a ticket in the project repository.
