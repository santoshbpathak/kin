import { Link } from 'react-router-dom'

/**
 * CG-9: IRDAI-mandated footer present on every screen.
 * Must display privacy policy link and compliance disclaimer.
 */
export function AppFooter() {
  return (
    <footer className="safe-bottom border-t border-hairline bg-sand px-4 py-3 text-center">
      <p className="text-[11px] leading-tight text-muted">
        KIN is a financial wellness platform. Insurance products are underwritten by licensed
        insurers. IRDAI does not endorse any particular insurer.{' '}
        <Link to="/privacy" className="text-teal-deep underline">
          Privacy Policy
        </Link>
      </p>
    </footer>
  )
}
