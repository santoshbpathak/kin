import { Link } from 'react-router-dom'

/**
 * CG-9: IRDAI-mandated footer present on every screen.
 * Must display privacy policy link and compliance disclaimer.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white px-4 py-3 text-center safe-bottom">
      <p className="text-[11px] leading-tight text-gray-400">
        KIN is a financial wellness platform. Insurance products are underwritten by licensed
        insurers. IRDAI does not endorse any particular insurer.{' '}
        <Link to="/privacy" className="underline hover:text-gray-600">
          Privacy Policy
        </Link>
      </p>
    </footer>
  )
}
