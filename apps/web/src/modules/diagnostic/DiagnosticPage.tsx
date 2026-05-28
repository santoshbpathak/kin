import { useAuth } from '@/modules/auth/AuthContext'
import { ConsentScreen } from '@/modules/auth/ConsentScreen'
import { DiagnosticChat } from './DiagnosticChat'

export function DiagnosticPage() {
  const { session } = useAuth()

  if (!session) {
    return <ConsentScreen onConsented={() => {}} />
  }

  return <DiagnosticChat />
}
