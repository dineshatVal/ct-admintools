import { screen, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import AdminDashboard from './admin-dashboard';

jest.mock('@commercetools-uikit/icons', () => ({
  UsersIcon: () => <div data-testid="users-icon" />,
}));

describe('AdminDashboard', () => {
  it('should render the title and onboard customer card', () => {
    render(
      <IntlProvider
        locale="en"
        messages={{
          'AdminDashboard.title': 'Admin Dashboard',
          'AdminDashboard.onboardCustomer': 'Onboard Customer',
        }}
      >
        <AdminDashboard />
      </IntlProvider>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Onboard Customer')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
  });
});
