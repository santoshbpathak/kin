import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { IconSearch } from '@/components/ui/icons'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center px-6 py-12">
      <Card className="mx-auto w-full max-w-sm text-center">
        <p className="t-micro text-muted">Page not found</p>
        <div className="mt-4 flex justify-center">
          <IconSearch size={48} className="text-navy" />
        </div>
        <h1 className="t-h2 mt-4 text-navy">We lost this page</h1>
        <p className="t-body mt-3 text-slate">
          This address does not exist in KIN. Let us take you somewhere useful instead.
        </p>
        <div className="mt-8 space-y-3">
          <Button fullWidth onClick={() => navigate('/')}>
            Go to Home
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate(-1 as never)}>
            Go back
          </Button>
        </div>
      </Card>
    </div>
  )
}
