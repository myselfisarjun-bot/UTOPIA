import * as AuthSession from 'expo-auth-session'

export function getAuthRedirectUrl() {
  return AuthSession.makeRedirectUri({
    scheme: 'ctonewapp',
    path: 'auth/callback',
  })
}
