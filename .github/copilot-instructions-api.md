# Copilot Instructions for API Functions (api/)

This file provides specific guidance for working with API functions located in the `api/` directory.

## Overview

The `api/` directory contains serverless API functions that can be deployed to Vercel or Cloudflare Workers. These functions handle backend logic for the website.

## Current Structure

```
api/
└── hello.js        # Example API endpoint
```

## API Function Basics

### Vercel Serverless Functions

API functions in the `api/` directory are automatically deployed as serverless functions on Vercel.

**URL Structure:**
- File: `api/hello.js` → Endpoint: `/api/hello`
- File: `api/users/list.js` → Endpoint: `/api/users/list`

### Function Template

```javascript
// api/hello.js
export default function handler(req, res) {
  // Parse request method
  const { method } = req;

  if (method === 'GET') {
    // Handle GET request
    return res.status(200).json({ message: 'Hello World' });
  }

  if (method === 'POST') {
    // Handle POST request
    const body = req.body;
    return res.status(200).json({ received: body });
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
```

## Development

### Local Testing

**Using Vercel CLI:**
```bash
# From project root
vercel dev
```

This starts a local development server that mimics Vercel's serverless environment. API endpoints are available at `http://localhost:3000/api/*`.

### Testing Endpoints

**Using curl:**
```bash
# GET request
curl http://localhost:3000/api/hello

# POST request
curl -X POST http://localhost:3000/api/hello \
  -H "Content-Type: application/json" \
  -d '{"name":"John"}'
```

**Using fetch in browser console:**
```javascript
// GET request
fetch('/api/hello')
  .then(res => res.json())
  .then(data => console.log(data));

// POST request
fetch('/api/hello', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
export default async function handler(req, res) {
  try {
    // Your logic here
    const data = await fetchData();
    return res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
```

### 2. Request Validation

Validate incoming requests:

```javascript
export default function handler(req, res) {
  // Validate method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate required fields
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'email']
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Process request
  // ...
}
```

### 3. CORS Configuration

Enable CORS for cross-origin requests:

```javascript
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or specific domain
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle actual request
  // ...
}
```

### 4. Rate Limiting

Implement basic rate limiting:

```javascript
// Simple in-memory rate limiter (use Redis for production)
const rateLimit = new Map();

export default function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  const limit = 100; // requests per window
  const window = 60000; // 1 minute in milliseconds

  const userData = rateLimit.get(ip) || { count: 0, resetTime: now + window };

  if (now > userData.resetTime) {
    userData.count = 0;
    userData.resetTime = now + window;
  }

  userData.count++;

  if (userData.count > limit) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((userData.resetTime - now) / 1000)
    });
  }

  rateLimit.set(ip, userData);

  // Process request
  // ...
}
```

### 5. Authentication

Example JWT authentication:

```javascript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default function handler(req, res) {
  // Extract token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Token is valid, process request
  req.user = decoded;
  // ...
}
```

## Environment Variables

### Setting Environment Variables

**For local development (`.env.local`):**
```bash
API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_jwt_secret
```

**For production (Vercel Dashboard):**
1. Go to Project Settings → Environment Variables
2. Add each variable with appropriate scope (Production, Preview, Development)

### Accessing Environment Variables

```javascript
export default function handler(req, res) {
  const apiKey = process.env.API_KEY;
  const dbUrl = process.env.DATABASE_URL;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Use environment variables
  // ...
}
```

**Important:**
- Never commit `.env.local` to git
- Add sensitive keys only in Vercel Dashboard for production
- Use different keys for development and production

## Response Formats

### Success Response

```javascript
res.status(200).json({
  success: true,
  data: {
    id: 1,
    name: 'John Doe',
  },
  timestamp: new Date().toISOString()
});
```

### Error Response

```javascript
res.status(400).json({
  success: false,
  error: 'Validation error',
  message: 'Invalid input data',
  details: [
    { field: 'email', message: 'Invalid email format' }
  ],
  timestamp: new Date().toISOString()
});
```

### Pagination Response

```javascript
res.status(200).json({
  success: true,
  data: items,
  pagination: {
    page: 1,
    perPage: 20,
    total: 100,
    totalPages: 5
  }
});
```

## HTTP Status Codes

Use appropriate status codes:

- **200 OK** - Successful GET, PUT, PATCH, DELETE
- **201 Created** - Successful POST that creates a resource
- **204 No Content** - Successful DELETE with no response body
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource not found
- **405 Method Not Allowed** - HTTP method not supported
- **409 Conflict** - Resource conflict (e.g., duplicate)
- **422 Unprocessable Entity** - Validation error
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Temporary server issue

## External API Integration

### Making HTTP Requests

**Using fetch:**
```javascript
export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.example.com/data', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('External API error:', error);
    return res.status(502).json({
      error: 'Failed to fetch external data',
      message: error.message
    });
  }
}
```

## Security Best Practices

### 1. Input Sanitization

Always sanitize user input:

```javascript
function sanitizeInput(str) {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 1000); // Limit length
}

export default function handler(req, res) {
  const userInput = sanitizeInput(req.body.message || '');
  // Use sanitized input
}
```

### 2. SQL Injection Prevention

Use parameterized queries:

```javascript
// BAD - vulnerable to SQL injection
const query = `SELECT * FROM users WHERE id = ${req.query.id}`;

// GOOD - parameterized query
const query = 'SELECT * FROM users WHERE id = ?';
const values = [req.query.id];
```

### 3. Secret Management

- Store secrets in environment variables
- Never commit secrets to git
- Use different secrets for dev/prod
- Rotate secrets regularly

### 4. HTTPS Only

- Always use HTTPS in production
- Vercel provides HTTPS automatically
- Reject HTTP requests if needed

## Deployment

### Vercel Deployment

API functions are automatically deployed with the project:

```bash
# Deploy to preview
vercel deploy

# Deploy to production
vercel --prod
```

**Deployment Process:**
1. Vercel detects API functions in `api/` directory
2. Each file becomes a serverless function
3. Functions are deployed to edge locations
4. Endpoints are available at `https://your-domain.com/api/*`

### Monitoring

Monitor API functions in Vercel Dashboard:
- View function logs
- Check execution time
- Monitor error rates
- Track invocations

## Testing

### Unit Testing

Use Jest or similar:

```javascript
// api/__tests__/hello.test.js
import handler from '../hello.js';
import { createMocks } from 'node-mocks-http';

describe('/api/hello', () => {
  test('returns hello message', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Hello World'
    });
  });
});
```

### Integration Testing

Test deployed endpoints:

```javascript
describe('API Integration Tests', () => {
  test('GET /api/hello', async () => {
    const response = await fetch('http://localhost:3000/api/hello');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Hello World');
  });
});
```

## Common Patterns

### Middleware Pattern

```javascript
// middleware/auth.js
export function withAuth(handler) {
  return async (req, res) => {
    // Check authentication
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = user;

    // Call actual handler
    return handler(req, res);
  };
}

// api/protected.js
import { withAuth } from '../middleware/auth';

async function handler(req, res) {
  // req.user is available here
  return res.status(200).json({
    message: 'Protected data',
    user: req.user
  });
}

export default withAuth(handler);
```

### Database Connection

```javascript
// lib/db.js
import { Pool } from 'pg';

let pool;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

// api/users.js
import { getDb } from '../lib/db';

export default async function handler(req, res) {
  const db = getDb();
  const result = await db.query('SELECT * FROM users');
  return res.status(200).json(result.rows);
}
```

## Resources

- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)
- [Node.js HTTP Module](https://nodejs.org/api/http.html)
- [Express.js API](https://expressjs.com/en/api.html) (for reference)
