import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '@/features/auth/login-page'

const { navigateMock, signInMock, loginMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signInMock: vi.fn(),
  loginMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/lib/auth', () => ({
  useAuthSession: () => ({
    session: null,
    signIn: signInMock,
    signOut: vi.fn(),
  }),
}))

vi.mock('@/lib/api', () => ({
  api: {
    login: loginMock,
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    signInMock.mockReset()
    loginMock.mockReset()
  })

  it('submits seeded tenant admin credentials through the backend login flow', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'token',
      expiresAtUtc: '2026-05-09T14:00:00Z',
      tenantId: 'tenant-1',
      tenantSlug: 'demo',
      operatorAccountId: 'operator-1',
      email: 'admin@contextlayer.local',
      displayName: 'Dana Mercer',
      role: 'tenant_admin',
    })

    render(<LoginPage />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /tenant admin/i }))
    await user.click(screen.getByRole('button', { name: /enter console/i }))

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        tenantSlug: 'demo',
        email: 'admin@contextlayer.local',
        password: 'DemoAdmin123!',
      }),
    )

    expect(signInMock).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'token',
        role: 'tenant_admin',
      }),
    )
    expect(navigateMock).toHaveBeenCalledWith({ to: '/demo' })
  })
})
