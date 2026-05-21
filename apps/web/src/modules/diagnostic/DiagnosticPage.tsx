import { useAuth } from '@/modules/auth/AuthContext'
import { ConsentScreen } from '@/modules/auth/ConsentScreen'
import { DiagnosticFlow } from './DiagnosticFlow'

export function DiagnosticPage() {
  const { session } = useAuth()

  if (!session) {
    return <ConsentScreen onConsented={() => {}} />
  }

  return <DiagnosticFlow />
}
