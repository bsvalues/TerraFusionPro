# API Documentation

## Overview
This document outlines the API design, endpoints, and usage for the project.

## API Architecture

### 1. REST API
1. Resource Design
```yaml
# REST API resource design
resources:
  - name: users
    path: /api/v1/users
    methods:
      - GET
      - POST
      - PUT
      - DELETE
    fields:
      - name: id
        type: string
        required: true
      - name: name
        type: string
        required: true
      - name: email
        type: string
        required: true
```

2. HTTP Methods
```yaml
# HTTP methods configuration
methods:
  GET:
    description: "Retrieve resources"
    response: 200
  POST:
    description: "Create resources"
    response: 201
  PUT:
    description: "Update resources"
    response: 200
  DELETE:
    description: "Delete resources"
    response: 204
```

3. Status Codes
```yaml
# Status codes configuration
status_codes:
  success:
    - code: 200
      description: "OK"
    - code: 201
      description: "Created"
    - code: 204
      description: "No Content"
  error:
    - code: 400
      description: "Bad Request"
    - code: 401
      description: "Unauthorized"
    - code: 403
      description: "Forbidden"
    - code: 404
      description: "Not Found"
    - code: 500
      description: "Internal Server Error"
```

### 2. GraphQL API
1. Schema Design
```yaml
# GraphQL schema design
schema:
  types:
    - name: User
      fields:
        - name: id
          type: ID!
        - name: name
          type: String!
        - name: email
          type: String!
    - name: Query
      fields:
        - name: user
          type: User
          args:
            - name: id
              type: ID!
    - name: Mutation
      fields:
        - name: createUser
          type: User
          args:
            - name: input
              type: UserInput!
```

2. Operations
```yaml
# GraphQL operations configuration
operations:
  queries:
    - name: getUser
      type: Query
      fields:
        - id
        - name
        - email
  mutations:
    - name: createUser
      type: Mutation
      fields:
        - id
        - name
        - email
```

3. Schema
```yaml
# GraphQL schema configuration
schema:
  directives:
    - name: auth
      locations:
        - FIELD_DEFINITION
        - OBJECT
  scalars:
    - name: DateTime
      type: String
  interfaces:
    - name: Node
      fields:
        - name: id
          type: ID!
```

### 3. WebSocket API
1. Connection Setup
```yaml
# WebSocket connection setup
connection:
  url: ws://api.example.com/ws
  protocol: v1
  headers:
    Authorization: Bearer ${token}
```

2. Message Handling
```yaml
# WebSocket message handling
messages:
  types:
    - name: subscribe
      payload:
        - channel
        - params
    - name: unsubscribe
      payload:
        - channel
    - name: message
      payload:
        - channel
        - data
```

3. Event Broadcasting
```yaml
# WebSocket event broadcasting
events:
  channels:
    - name: users
      events:
        - name: created
          payload:
            - id
            - name
            - email
        - name: updated
          payload:
            - id
            - name
            - email
```

## API Endpoints

### 1. Property API
1. Get Properties
```yaml
# Get properties endpoint
endpoint:
  path: /api/v1/properties
  method: GET
  query:
    - name: page
      type: number
      required: false
    - name: limit
      type: number
      required: false
  response:
    type: array
    items:
      type: object
      properties:
        - name: id
          type: string
        - name: address
          type: string
        - name: value
          type: number
```

2. Create Property
```yaml
# Create property endpoint
endpoint:
  path: /api/v1/properties
  method: POST
  body:
    type: object
    properties:
      - name: address
        type: string
        required: true
      - name: value
        type: number
        required: true
  response:
    type: object
    properties:
      - name: id
        type: string
      - name: address
        type: string
      - name: value
        type: number
```

3. Update Property
```yaml
# Update property endpoint
endpoint:
  path: /api/v1/properties/{id}
  method: PUT
  params:
    - name: id
      type: string
      required: true
  body:
    type: object
    properties:
      - name: address
        type: string
        required: false
      - name: value
        type: number
        required: false
  response:
    type: object
    properties:
      - name: id
        type: string
      - name: address
        type: string
      - name: value
        type: number
```

### 2. Valuation API
1. Get Valuations
```yaml
# Get valuations endpoint
endpoint:
  path: /api/v1/valuations
  method: GET
  query:
    - name: property_id
      type: string
      required: false
    - name: page
      type: number
      required: false
    - name: limit
      type: number
      required: false
  response:
    type: array
    items:
      type: object
      properties:
        - name: id
          type: string
        - name: property_id
          type: string
        - name: value
          type: number
        - name: date
          type: string
```

2. Create Valuation
```yaml
# Create valuation endpoint
endpoint:
  path: /api/v1/valuations
  method: POST
  body:
    type: object
    properties:
      - name: property_id
        type: string
        required: true
      - name: value
        type: number
        required: true
      - name: date
        type: string
        required: true
  response:
    type: object
    properties:
      - name: id
        type: string
      - name: property_id
        type: string
      - name: value
        type: number
      - name: date
        type: string
```

3. Update Valuation
```yaml
# Update valuation endpoint
endpoint:
  path: /api/v1/valuations/{id}
  method: PUT
  params:
    - name: id
      type: string
      required: true
  body:
    type: object
    properties:
      - name: value
        type: number
        required: false
      - name: date
        type: string
        required: false
  response:
    type: object
    properties:
      - name: id
        type: string
      - name: property_id
        type: string
      - name: value
        type: number
      - name: date
        type: string
```

### 3. User API
1. Get Users
```yaml
# Get users endpoint
endpoint:
  path: /api/v1/users
  method: GET
  query:
    - name: page
      type: number
      required: false
    - name: limit
      type: number
      required: false
  response:
    type: array
    items:
      type: object
      properties:
        - name: id
          type: string
        - name: name
          type: string
        - name: email
          type: string
```

2. Create User
```yaml
# Create user endpoint
endpoint:
  path: /api/v1/users
  method: POST
  body:
    type: object
    properties:
      - name: name
        type: string
        required: true
      - name: email
        type: string
        required: true
      - name: password
        type: string
        required: true
  response:
    type: object
    properties:
      - name: id
        type: string
      - name: name
        type: string
      - name: email
        type: string
```

3. Update User
```yaml
# Update user endpoint
endpoint:
  path: /api/v1/users/{id}
  method: PUT
  params:
    - name: id
      type: string
      required: true
  body:
    type: object
    properties:
      - name: name
        type: string
        required: false
      - name: email
        type: string
        required: false
  response:
    type: object
    properties:
      - name: id
        type: string
      - name: name
        type: string
      - name: email
        type: string
```

## API Security

### 1. Authentication
1. JWT
```yaml
# JWT authentication configuration
jwt:
  secret: ${JWT_SECRET}
  algorithm: HS256
  expiresIn: 1h
  refreshToken:
    expiresIn: 7d
  claims:
    - name: sub
      type: string
      required: true
    - name: iat
      type: number
      required: true
    - name: exp
      type: number
      required: true
```

2. OAuth 2.0
```yaml
# OAuth 2.0 authentication configuration
oauth:
  providers:
    - name: google
      clientId: ${GOOGLE_CLIENT_ID}
      clientSecret: ${GOOGLE_CLIENT_SECRET}
      redirectUri: ${OAUTH_REDIRECT_URI}
      scope:
        - email
        - profile

    - name: github
      clientId: ${GITHUB_CLIENT_ID}
      clientSecret: ${GITHUB_CLIENT_SECRET}
      redirectUri: ${OAUTH_REDIRECT_URI}
      scope:
        - user:email
        - read:user
```

3. API Keys
```yaml
# API key authentication configuration
api_keys:
  header: X-API-Key
  validation:
    - name: format
      pattern: ^[a-zA-Z0-9]{32}$
    - name: expiration
      period: 30d
```

### 2. Authorization
1. Role-based Access Control
```yaml
# RBAC configuration
rbac:
  roles:
    - name: admin
      permissions:
        - resource: *
          action: *
    - name: user
      permissions:
        - resource: profile
          action: read
        - resource: data
          action: read
    - name: guest
      permissions:
        - resource: public
          action: read
```

2. Resource-based Access Control
```yaml
# Resource-based access control configuration
resource_access:
  resources:
    - name: profile
      actions:
        - read
        - write
      conditions:
        - type: owner
          field: userId
    - name: data
      actions:
        - read
        - write
      conditions:
        - type: role
          value: admin
```

3. Policy-based Access Control
```yaml
# Policy-based access control configuration
policy_access:
  policies:
    - name: data_access
      effect: allow
      actions:
        - read
        - write
      resources:
        - data:*
      conditions:
        - type: role
          value: admin
    - name: profile_access
      effect: allow
      actions:
        - read
        - write
      resources:
        - profile:*
      conditions:
        - type: owner
          field: userId
```

### 3. Rate Limiting
1. Configuration
```yaml
# Rate limiting configuration
rate_limiting:
  window: 1m
  max: 100
  message: "Too many requests"
  headers:
    - name: X-RateLimit-Limit
      value: 100
    - name: X-RateLimit-Remaining
      value: 99
    - name: X-RateLimit-Reset
      value: 60
```

2. Throttling
```yaml
# Throttling configuration
throttling:
  burst: 10
  rate: 5
  window: 1s
  message: "Too many requests"
```

3. Quotas
```yaml
# Quotas configuration
quotas:
  daily:
    limit: 1000
    window: 24h
  monthly:
    limit: 10000
    window: 30d
```

## API Documentation

### 1. OpenAPI/Swagger
1. Specification
```yaml
# OpenAPI specification
openapi: 3.0.0
info:
  title: Property API
  version: 1.0.0
  description: API for property management
paths:
  /api/v1/properties:
    get:
      summary: Get properties
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Property'
```

2. Models
```yaml
# OpenAPI models
components:
  schemas:
    Property:
      type: object
      properties:
        id:
          type: string
        address:
          type: string
        value:
          type: number
      required:
        - id
        - address
        - value
```

3. Security
```yaml
# OpenAPI security
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

### 2. Postman Collection
1. Structure
```yaml
# Postman collection structure
collection:
  info:
    name: Property API
    description: API for property management
  item:
    - name: Properties
      item:
        - name: Get Properties
          request:
            method: GET
            url: /api/v1/properties
        - name: Create Property
          request:
            method: POST
            url: /api/v1/properties
```

2. Environment Variables
```yaml
# Postman environment variables
environment:
  name: Development
  variable:
    - name: baseUrl
      value: http://localhost:3000
    - name: apiKey
      value: ${API_KEY}
```

3. Test Scripts
```yaml
# Postman test scripts
test:
  - name: Get Properties
    script: |
      pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
      });
      pm.test("Response is an array", function () {
        var jsonData = pm.response.json();
        pm.expect(Array.isArray(jsonData)).to.be.true;
      });
```

### 3. Request/Response Examples
1. Request Examples
```yaml
# Request examples
examples:
  - name: Create Property
    request:
      method: POST
      url: /api/v1/properties
      body:
        address: "123 Main St"
        value: 500000
    response:
      status: 201
      body:
        id: "123"
        address: "123 Main St"
        value: 500000
```

2. Response Examples
```yaml
# Response examples
examples:
  - name: Get Properties
    response:
      status: 200
      body:
        - id: "123"
          address: "123 Main St"
          value: 500000
        - id: "124"
          address: "124 Main St"
          value: 600000
```

3. Error Examples
```yaml
# Error examples
examples:
  - name: Invalid Request
    response:
      status: 400
      body:
        error: "Bad Request"
        message: "Invalid input"
  - name: Unauthorized
    response:
      status: 401
      body:
        error: "Unauthorized"
        message: "Invalid token"
``` 