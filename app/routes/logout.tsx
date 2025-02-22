// app/routes/auth/google/callback.tsx
import { LoaderArgs } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'

export let loader = ({ request }: LoaderArgs) => {
  return authenticator.logout(request, {
    redirectTo: '/login',
  })
}