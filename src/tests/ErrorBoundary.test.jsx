import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

function BrokenComponent() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders a fallback view instead of crashing the app', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeTruthy();
    expect(screen.getByText(/please refresh/i)).toBeTruthy();
  });
});
