# CO-GRI Platform Testing Guide

## Overview

This document provides comprehensive guidance on testing the CO-GRI Platform, including unit tests, integration tests, and end-to-end tests.

---

## Test Structure

```
src/tests/
├── integration/           # Integration tests for modes
│   ├── companyModeIntegration.test.tsx
│   ├── forecastMode.test.tsx
│   ├── scenarioMode.test.tsx
│   ├── tradingMode.test.tsx
│   └── unifiedFramework.test.tsx
├── unit/                  # Unit tests for utilities and engines
│   ├── cogriPipeline.test.ts
│   ├── riskCalculations.test.ts
│   ├── tradingEngine.test.ts
│   ├── week3Utilities.test.ts
│   └── week4Utilities.test.ts
└── e2e/                   # End-to-end tests (future)
    └── userJourneys.test.ts
```

---

## Running Tests

### All Tests
```bash
pnpm test
```

### Specific Test File
```bash
pnpm test src/tests/integration/tradingMode.test.tsx
```

### Watch Mode
```bash
pnpm test:watch
```

### With Coverage
```bash
pnpm test:coverage
```

### With UI
```bash
pnpm test:ui
```

---

## Test Coverage Goals

### Current Coverage
- **Integration Tests**: 7 files, 1,997 lines
- **Unit Tests**: 5 files, covering core engines and utilities
- **Total Test Files**: 75+ test files

### Coverage Targets
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## Writing Tests

### Integration Test Template

```typescript
/**
 * [Mode Name] Integration Tests
 * Part of CO-GRI Platform Phase 3
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('[Mode Name] Integration Tests', () => {
  let mockData: any;

  beforeEach(() => {
    // Setup mock data
    mockData = generateMockData();
  });

  describe('Feature Group', () => {
    it('should perform expected behavior', () => {
      // Arrange
      const input = mockData;
      
      // Act
      const result = performAction(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.property).toBe(expectedValue);
    });
  });
});
```

### Unit Test Template

```typescript
/**
 * [Component/Utility] Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { functionToTest } from '@/path/to/module';

describe('[Component/Utility] Unit Tests', () => {
  describe('functionToTest', () => {
    it('should handle valid input', () => {
      const result = functionToTest(validInput);
      expect(result).toBe(expectedOutput);
    });

    it('should handle edge cases', () => {
      const result = functionToTest(edgeCase);
      expect(result).toBeDefined();
    });

    it('should throw on invalid input', () => {
      expect(() => functionToTest(invalidInput)).toThrow();
    });
  });
});
```

---

## Test Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mock Data
- Use realistic mock data
- Keep mock data consistent across tests
- Store reusable mocks in separate files

### 3. Assertions
- Use specific matchers (`toBe`, `toEqual`, `toBeCloseTo`)
- Test both success and failure cases
- Verify all important properties

### 4. Async Tests
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### 5. Error Handling
```typescript
it('should throw on invalid input', () => {
  expect(() => functionWithError()).toThrow('Expected error message');
});
```

---

## Test Scenarios by Mode

### Company Mode Tests
- **Structural Tab**: CO-GRI calculation, component rendering
- **Forecast Tab**: Forecast delta application, outlook classification
- **Trading Tab**: Signal generation, price targets
- **Interactions**: Country clicks, event selection, deep linking

### Forecast Mode Tests
- **Event Filtering**: Relevance filtering, threshold application
- **Delta Application**: Forecast delta calculation, exposure integrity
- **Outlook Classification**: Headwind/Tailwind/Mixed/Neutral
- **Mock Data**: Executive summary, regional assessments

### Scenario Mode Tests
- **Preset Scenarios**: Scenario loading, configuration validation
- **Scenario Results**: Impact calculation, propagation timeline
- **Comparison**: Multi-scenario comparison, severity ranking

### Trading Mode Tests
- **Signal Generation**: Signal creation, driver calculation
- **Portfolio Optimization**: Optimization algorithms, constraint enforcement
- **Backtesting**: Performance metrics, equity curve, attribution

---

## Common Test Issues

### Issue: Test Timeout
```typescript
// Increase timeout for slow tests
it('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Issue: Flaky Tests
- Avoid time-dependent assertions
- Use deterministic mock data
- Properly clean up after tests

### Issue: Mock Data Inconsistency
- Use factories for mock data generation
- Validate mock data structure
- Keep mocks up-to-date with types

---

## Continuous Integration

### Pre-commit Checks
```bash
# Run before committing
pnpm run lint
pnpm test
pnpm run build
```

### CI Pipeline
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm run build
```

---

## Test Maintenance

### Regular Tasks
- [ ] Update tests when features change
- [ ] Add tests for new features
- [ ] Remove tests for deprecated features
- [ ] Review and update mock data
- [ ] Check test coverage reports
- [ ] Fix flaky tests
- [ ] Optimize slow tests

### Quarterly Review
- [ ] Audit test coverage
- [ ] Identify untested code paths
- [ ] Update test documentation
- [ ] Review test performance
- [ ] Update CI/CD pipeline

---

## Resources

### Testing Libraries
- **Vitest**: Test runner and framework
- **@testing-library/react**: React component testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom matchers

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: March 2026  
**Maintained by**: CO-GRI Platform Engineering Team