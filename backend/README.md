# Backend Service

A robust Node.js backend service built with Express and TypeScript in strict mode, featuring comprehensive middleware, structured logging, and configuration management.

## Features

- **TypeScript Strict Mode**: Full type safety and strict compiler checks
- **Express.js**: Fast, unopinionated web framework
- **Security**: Helmet for security headers, CORS configuration
- **Performance**: Compression middleware for response optimization
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Request ID Propagation**: Unique request IDs for distributed tracing
- **Structured Logging**: Pino logger with request/response timing
- **Error Handling**: Centralized error handling with custom error classes
- **Configuration Management**: Environment-based config with schema validation
- **Health Checks**: Built-in health check endpoint
- **Testing**: Jest with >70% coverage threshold

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Server Configuration
- `NODE_ENV`: Environment mode (`development`, `production`, `test`)
- `PORT`: Server port (default: `3000`)

### Logging
- `LOG_LEVEL`: Logging level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`)

### InnerTube API Credentials (Optional)
- `INNERTUBE_API_KEY`: API key for InnerTube service
- `INNERTUBE_CLIENT_ID`: Client ID for InnerTube authentication
- `INNERTUBE_CLIENT_SECRET`: Client secret for InnerTube authentication

### Timeouts
- `REQUEST_TIMEOUT_MS`: Request timeout in milliseconds (default: `30000`)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: `900000` - 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: `100`)

### Retry Configuration
- `RETRY_MAX_ATTEMPTS`: Maximum retry attempts (default: `3`)
- `RETRY_DELAY_MS`: Delay between retries in milliseconds (default: `1000`)

### Body Parsing
- `BODY_SIZE_LIMIT`: Maximum request body size (default: `10mb`)

### CORS Configuration
- `CORS_ORIGIN`: Allowed CORS origin (default: `*`)
- `CORS_CREDENTIALS`: Enable credentials in CORS (default: `false`)

## Development

### Running the Development Server

```bash
npm run dev
```

The server will start with hot-reload enabled on the configured port (default: 3000).

### Building for Production

```bash
npm run build
```

Compiled JavaScript will be output to the `dist/` directory.

### Running in Production

```bash
npm start
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

The project enforces a minimum coverage threshold of 70% for:
- Branches
- Functions
- Lines
- Statements

## Linting and Formatting

### Run ESLint

```bash
npm run lint
```

### Fix ESLint Issues

```bash
npm run lint:fix
```

### Format Code with Prettier

```bash
npm run format
```

### Check Formatting

```bash
npm run format:check
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management and schema validation
│   ├── middleware/      # Express middleware (request ID, logging, rate limiting, errors)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions and custom errors
│   ├── utils/           # Utility functions and helpers (logger)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript (generated)
├── coverage/            # Test coverage reports (generated)
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Example environment variables
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Jest test configuration
├── .eslintrc.json       # ESLint configuration
├── .prettierrc.json     # Prettier configuration
└── package.json         # Project dependencies and scripts
```

## Middleware Stack

The application uses the following middleware in order:

1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Compression**: Response compression
4. **Body Parsers**: JSON and URL-encoded parsing with size limits
5. **Request ID**: Unique request ID generation and propagation
6. **Request Logger**: Structured request/response logging with timing
7. **Rate Limiter**: Configurable rate limiting (bypassed for /health)
8. **Routes**: Application routes
9. **404 Handler**: Not found error handler
10. **Error Handler**: Centralized error handling

## API Endpoints

### Health Check

```
GET /health
```

Returns server health status:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## Error Handling

The service uses custom error classes for different scenarios:

- `AppError`: Base error class for operational errors
- `ValidationError`: 400 - Invalid request data
- `UnauthorizedError`: 401 - Authentication required
- `ForbiddenError`: 403 - Insufficient permissions
- `NotFoundError`: 404 - Resource not found
- `TooManyRequestsError`: 429 - Rate limit exceeded
- `InternalServerError`: 500 - Server error

All errors include:
- Error message
- HTTP status code
- Request ID for tracing
- Stack trace (development only)

## Logging

Structured logging with Pino includes:

- Request start/end with timing
- Request ID propagation
- Response status codes
- Error logging with context
- Pretty printing in development
- JSON output in production

## Scripts Reference

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## License

ISC
