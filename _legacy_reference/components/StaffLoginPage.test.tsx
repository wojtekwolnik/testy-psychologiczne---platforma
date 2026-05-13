
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffLoginPage } from './StaffLoginPage';
import { AuthContext, AuthProvider } from '../contexts/AuthContext'; // Importujemy też AuthProvider
import { BrandingContext } from '../contexts/BrandingContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';

// --- MOCKI --- //

const mockLogin = vi.fn();
const mockBranding = {
  appName: 'Test App',
  logoUrl: ''
};

// --- FUNKCJA POMOCNICZA --- //

const renderComponent = (authContextValue: any) => {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={['/staff']}>
      <AuthContext.Provider value={authContextValue}>
        <BrandingContext.Provider value={{ branding: mockBranding, setBranding: vi.fn(), applyTheme: vi.fn() }}>
            <Routes>
                <Route path="/" element={<div>Strona Klienta</div>} />
                <Route path="/staff" element={<StaffLoginPage />} />
            </Routes>
        </BrandingContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return { ...utils, user };
};

// --- TESTY --- //

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StaffLoginPage', () => {

  test('renders component correctly and all elements are visible', () => {
    const mockAuth = { user: null, isLoading: false, login: mockLogin };
    renderComponent(mockAuth);
    
    expect(screen.getByText('Logowanie personelu')).toBeInTheDocument();
    expect(screen.getByLabelText('Adres email')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeInTheDocument();
    expect(screen.getByText('← Powrót do strony klienta')).toBeInTheDocument();
  });

  test('allows user to type into email and password fields', async () => {
    const mockAuth = { user: null, isLoading: false, login: mockLogin };
    const { user } = renderComponent(mockAuth);

    const emailInput = screen.getByLabelText('Adres email');
    const passwordInput = screen.getByLabelText('Hasło');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('calls login function with credentials on form submission', async () => {
    const mockAuth = { user: null, isLoading: false, login: mockLogin };
    const { user } = renderComponent(mockAuth);

    const testEmail = 'admin@test.com';
    const testPassword = 'password123';

    await user.type(screen.getByLabelText('Adres email'), testEmail);
    await user.type(screen.getByLabelText('Hasło'), testPassword);
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith(testEmail, testPassword);
  });

  test('disables the login button while authentication is in progress', () => {
    const mockAuthLoading = { user: null, isLoading: true, login: mockLogin };
    renderComponent(mockAuthLoading);

    // Poprawka: szukamy przycisku po tekście, który jest wyświetlany w trakcie ładowania
    const loginButton = screen.getByRole('button', { name: 'Logowanie...' });

    expect(loginButton).toBeDisabled();
  });

  test('displays an error message on login failure', async () => {
    const loginError = new Error('Invalid credentials');
    const mockAuthFailure = { user: null, isLoading: false, login: vi.fn().mockRejectedValue(loginError) };
    const { user } = renderComponent(mockAuthFailure);

    await user.type(screen.getByLabelText('Adres email'), 'wrong@test.com');
    await user.type(screen.getByLabelText('Hasło'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Zaloguj się' }));

    // Czekamy na pojawienie się elementu z rolą 'alert' zawierającego błąd
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/Invalid credentials/i);

    expect(screen.getByRole('button', { name: 'Zaloguj się' })).not.toBeDisabled();
  });

  test('navigates back to client page on button click', async () => {
    const mockAuth = { user: null, isLoading: false, login: mockLogin };
    const { user } = renderComponent(mockAuth);

    const backButton = screen.getByText('← Powrót do strony klienta');
    await user.click(backButton);

    expect(await screen.findByText('Strona Klienta')).toBeInTheDocument();
    expect(screen.queryByText('Logowanie personelu')).not.toBeInTheDocument();
  });
});
