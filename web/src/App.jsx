import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAuth } from './components/ui'
import Home from './pages/Home'
import Play from './pages/Play'
import Ranking from './pages/Ranking'
import { Login, Register, ResetPassword } from './pages/Auth'
import Community from './pages/Community'
import IdeaDetail from './pages/IdeaDetail'
import Learn from './pages/Learn'
import Article from './pages/Article'
import Contribute from './pages/Contribute'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="jogar" element={<Play />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="entrar" element={<Login />} />
        <Route path="registar" element={<Register />} />
        <Route path="nova-senha" element={<ResetPassword />} />
        <Route path="comunidade" element={<Community />} />
        <Route path="comunidade/:id" element={<IdeaDetail />} />
        <Route path="aprender" element={<Learn />} />
        <Route path="aprender/:id" element={<Article />} />
        <Route path="contribuir" element={<Contribute />} />
        <Route path="perfil" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
