# Cypress Testing Guide

This directory contains Cypress tests for the NFF Web UI application.

## Structure

```
cypress/
├── component/          # Component tests
├── e2e/               # End-to-end tests
├── fixtures/          # Test data
├── support/           # Support files and commands
└── tsconfig.json      # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js and npm installed
- Application running on `http://localhost:3000`

### Running Tests

#### Open Cypress Test Runner

```bash
# Open Cypress for component testing
npm run cypress:open:component

# Open Cypress for E2E testing
npm run cypress:open:e2e

# Open Cypress (defaults to E2E)
npm run cypress:open
```

#### Run Tests Headlessly

```bash
# Run all E2E tests
npm run test:e2e

# Run all component tests
npm run test:component

# Run all tests
npm run cypress:run
```

## Test Types

### Component Tests

Component tests are located in `cypress/component/` and test individual React components in isolation.

Example:
```tsx
import React from 'react'
import { Button } from '../../src/components/Button'

describe('Button Component', () => {
  it('renders with default props', () => {
    cy.mount(<Button>Click me</Button>)
    cy.get('button').should('contain.text', 'Click me')
  })
})
```

### E2E Tests

E2E tests are located in `cypress/e2e/` and test the full application flow.

Example:
```tsx
describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the home page', () => {
    cy.get('body').should('be.visible')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })
})
```

## Custom Commands

The following custom commands are available:

- `cy.login(email, password)` - Login with credentials
- `cy.waitForPageLoad()` - Wait for page to fully load
- `cy.shouldBeVisibleAndClickable(selector)` - Check if element is visible and clickable
- `cy.typeWithDelay(selector, text, delay)` - Type text with delay
- `cy.selectFromDropdown(dropdownSelector, optionText)` - Select from dropdown
- `cy.uploadFile(selector, filePath)` - Upload a file
- `cy.shouldShowToast(message)` - Check toast notification
- `cy.waitForApiResponse(method, url)` - Wait for API response
- `cy.clearLocalStorage()` - Clear local storage
- `cy.clearCookies()` - Clear cookies
- `cy.resetDatabase()` - Reset database state

## Configuration

Cypress configuration is in `cypress.config.ts` at the project root.

Key settings:
- Base URL: `http://localhost:3000`
- Viewport: 1280x720
- Component testing with Next.js and webpack
- E2E testing with custom support files

## Best Practices

1. **Use data-cy attributes** for selecting elements
2. **Keep tests independent** - don't rely on other tests
3. **Use custom commands** for common operations
4. **Test responsive design** with different viewports
5. **Handle async operations** properly with `cy.wait()` or `cy.intercept()`

## Troubleshooting

### Common Issues

1. **Component not mounting**: Check if `@cypress/react` is installed
2. **TypeScript errors**: Ensure `cypress/tsconfig.json` is properly configured
3. **JSX errors**: Verify `jsx: "react-jsx"` in tsconfig
4. **Mount command not found**: Check if mount is properly imported in support files

### Debug Mode

Run tests with debug information:
```bash
DEBUG=cypress:* npm run test:e2e
```

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress React Component Testing](https://docs.cypress.io/guides/component-testing/react/overview)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
