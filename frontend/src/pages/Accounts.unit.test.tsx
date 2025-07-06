
/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import Accounts from './Accounts';
import * as accountService from '../lib/accountService';
import { MemoryRouter } from 'react-router-dom';

// Mock the useCompanyOverview hook
vi.mock('../lib/useCompanyOverview', () => ({
  useCompanyOverview: () => ({
    companyName: 'Test Company',
    companyUrl: 'https://test.com',
    description: 'Test description',
  }),
}));

describe('Accounts Page Basic Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page header', () => {
    vi.spyOn(accountService, 'getStoredTargetAccounts').mockReturnValue([]);
    render(
      <MemoryRouter>
        <Accounts />
      </MemoryRouter>
    );
    expect(screen.getByText('Target Accounts')).toBeInTheDocument();
    expect(screen.getByText('Identify and manage your ideal target accounts')).toBeInTheDocument();
  });
});
