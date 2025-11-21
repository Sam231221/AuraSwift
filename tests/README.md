# AuraSwift Test Suite

This directory contains all tests for the AuraSwift POS System.

## Structure

```
tests/
├── unit/              # Unit tests for isolated functions/classes
├── integration/       # Integration tests for component interactions
├── components/        # React component tests
├── e2e/              # End-to-end tests (Playwright)
├── utils/            # Test utilities and helpers
│   ├── test-helpers.ts
│   ├── db-setup.ts
│   └── fixtures/
└── setup.ts          # Global test setup
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Component Tests Only
```bash
npm run test:components
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode (Vitest)
```bash
npm run test:ui
```

## Writing Tests

### Unit Test Example
See `tests/unit/main/database/managers/transactionManager.test.ts.example`

### Component Test Example
See `tests/components/views/cashier/product-card.test.tsx.example`

### Integration Test Example
See `docs/Testing/TESTING_STRUCTURE.md` for examples

## Test Utilities

- `test-helpers.ts`: Mock factories and common utilities
- `db-setup.ts`: Database setup/teardown for integration tests
- `fixtures/`: Reusable test data

## Best Practices

1. **Mirror source structure**: Keep test files close to source files
2. **Use descriptive names**: Test names should clearly describe what they test
3. **One assertion per test**: Keep tests focused and simple
4. **Mock external dependencies**: Don't test third-party code
5. **Clean up**: Always clean up test data and mocks

## Coverage Goals

- **Business Logic**: 80%+ coverage
- **UI Components**: 60%+ coverage
- **Utilities**: 90%+ coverage

See `docs/Testing/TESTING_STRUCTURE.md` for comprehensive documentation.

