import { Link } from 'react-router-dom'
import { Page } from '../components/ui'

export default function NotFound() {
  return (
    <Page title="Página não encontrada" subtitle="Esta página não existe ou foi movida.">
      <Link to="/" className="btn">Voltar ao início</Link>
    </Page>
  )
}
