# Testing Quick Reference

## 🚀 Local Commands

```bash
# Development (watch mode)
npm run test:watch

# Run all tests
npm run test:all

# Specific test types
npm run test:unit              # All unit tests
npm run test:unit:main         # Main process unit tests
npm run test:unit:renderer     # Renderer process unit tests
npm run test:components        # Component tests
npm run test:integration       # All integration tests
npm run test:integration:main  # Main process integration
npm run test:integration:renderer # Renderer integration
npm run test:e2e               # E2E tests

# Coverage
npm run test:coverage          # Generate coverage
npm run test:coverage:html     # Open coverage in browser

# E2E specific
npm run test:e2e:ui            # Interactive UI
npm run test:e2e:debug        # Debug mode
npm run test:e2e:headed        # See browser
npm run test:e2e:report       # View report
```

## 📋 Test File Patterns

- **Unit/Component/Integration**: `*.test.ts` or `*.test.tsx`
- **E2E**: `*.spec.ts`

## 📁 Test Locations

```
tests/
├── unit/              # Unit tests
│   ├── main/         # Main process
│   └── renderer/     # Renderer process
├── components/        # Component tests
├── integration/      # Integration tests
│   ├── main/
│   └── renderer/
└── e2e/              # E2E tests
```

## 🔄 CI Workflow

Tests run automatically on:

- ✅ Pull requests (when test files change)
- ✅ Pushes to main (when test files change)
- ✅ Manual trigger

## 📊 Coverage Thresholds

- Overall: 70% minimum, 80% target
- Business Logic: 85% minimum, 95% target
- Components: 75% minimum, 85% target
- Utilities: 90% minimum, 95% target

## 🐛 Debugging

**Local:**

```bash
npm run test:ui        # Vitest UI
npm run test:e2e:ui    # Playwright UI
npm run test:e2e:debug # Playwright debug
```

**CI:**

- Check workflow artifacts
- Download test results
- View E2E screenshots/videos

## ⚡ Quick Tips

1. Use `test:watch` during development
2. Run `test:all` before committing
3. Check coverage with `test:coverage:html`
4. Use E2E UI for debugging complex flows
5. Check CI artifacts for failed tests

---

For detailed information, see [TESTING_GUIDE.md](TESTING_GUIDE.md)
