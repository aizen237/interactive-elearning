# Testing Infrastructure

This directory contains the testing setup for the frontend application.

## Setup

The testing infrastructure uses:
- **Vitest** - Fast unit test framework powered by Vite
- **React Testing Library** - Testing utilities for React components
- **Happy-DOM** - Lightweight DOM implementation for testing
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

## Configuration

- **vite.config.js** - Contains Vitest configuration
- **setup.js** - Test setup file that runs before each test suite

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Writing Tests

Tests should be co-located with components using the `.test.jsx` or `.test.js` suffix.

Example:
```
src/components/
  ├── FidelChart.jsx
  └── FidelChart.test.jsx
```

### Example Test

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Available Matchers

The setup includes jest-dom matchers for enhanced assertions:
- `toBeInTheDocument()`
- `toHaveTextContent()`
- `toHaveClass()`
- `toBeVisible()`
- And many more...

See [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) for full list.
