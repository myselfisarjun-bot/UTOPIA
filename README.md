# Project

This repository contains a full-stack application with a Node.js backend service.

## Workspaces

### `/backend`

A robust Node.js backend service built with Express and TypeScript in strict mode.

**Quick Start:**
```bash
cd backend
npm install
npm run dev
```

See [backend/README.md](./backend/README.md) for detailed documentation.

**Key Features:**
- Express.js with TypeScript strict mode
- Comprehensive middleware stack (Helmet, CORS, compression, rate limiting)
- Request ID propagation for distributed tracing
- Structured logging with Pino
- Configuration management with schema validation
- Centralized error handling
- Health check endpoints
- Jest testing with >70% coverage

**Available Scripts:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code

## Development

Each workspace is independent and has its own `package.json` and configuration files.

## License

ISC
