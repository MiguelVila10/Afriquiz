import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories } from '../lib/categories'
import { useAuth } from '../lib/auth'
import { Alert, Page, Spinner } from '../components/ui'
import Result from '../components/Result'
import GameScreen from '../components/GameScreen'

const COUNTS = [5, 10, 15, 20, 25]

export default function Play() {
  const { categories, error: catError } = useCategories()
  const { user, profile } = useAuth()

  const [category, setCategory] = useState('africa')
  const [count, setCount] = useState(5)
  const [phase, setPhase] = useState('config') // config | loading | question | answered | result
  const [session, setSession] = useState(null)
  const [question, setQuestion] = useState(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [chosen, setChosen] = useState(undefined) // opção escolhida (null = tempo esgotado)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const sending = useRef(false)
  const shownAt = useRef(0) // momento (ms) em que a pergunta apareceu, já descontando o tempo gasto
  const [log, setLog] = useState([]) // histórico desta partida para o gráfico final

  const loadNext = useCallback(async (sessionId) => {
    setPhase('loading')
    const { data, error } = await supabase.rpc('next_question', { p_session: sessionId })
    if (error) {
      setError(friendlyError(error))
      setPhase('config')
      return
    }
    if (!data || data.length === 0) {
      setPhase('result')
      return
    }
    const q = data[0]
    setChosen(undefined)
    setQuestion(q)
    setTotal(q.q_total)
    setTimeLeft(q.q_time_left)
    shownAt.current = performance.now() - (15 - q.q_time_left) * 1000
    sending.current = false
    setPhase('question')
  }, [])

  const advance = useRef(null) // passagem automática para a próxima pergunta

  const answer = useCallback(
    async (choice) => {
      if (sending.current) return
      sending.current = true
      const timedOut = choice === null
      const secs = timedOut ? 15 : Math.min(15, Math.round((performance.now() - shownAt.current) / 100) / 10)
      setChosen(choice)
      setPhase('answered')
      const { data, error } = await supabase.rpc('answer_question', { p_session: session, p_choice: choice })
      if (error) {
        setError(friendlyError(error))
        setChosen(undefined)
        setPhase('question')
        sending.current = false
        return
      }
      const r = data[0]
      setLog((l) => [
        ...l,
        { position: question.q_position, text: question.q_text, seconds: secs, result: timedOut ? 'timeout' : r.r_correct ? 'correct' : 'wrong' },
      ])
      setScore(r.r_score)
      // Sem revelar a resposta: uma pausa curta para ver a escolha marcada e segue
      advance.current = setTimeout(() => {
        if (r.r_finished) setPhase('result')
        else loadNext(session)
      }, timedOut ? 1300 : 800)
    },
    [session, question, loadNext]
  )

  useEffect(() => () => clearTimeout(advance.current), [])

  // Cronómetro (o servidor também controla o tempo — isto é só o visor)
  useEffect(() => {
    if (phase !== 'question') return
    if (timeLeft <= 0) {
      answer(null)
      return
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, timeLeft, answer])

  async function start() {
    setError(null)
    setScore(0)
    setLog([])
    setQuestion(null)
    setPhase('loading')
    const { data, error } = await supabase.rpc('start_quiz', { p_category: category, p_count: count })
    if (error) {
      setError(friendlyError(error))
      setPhase('config')
      return
    }
    setSession(data)
    loadNext(data)
  }

  function restart() {
    clearTimeout(advance.current)
    setPhase('config')
    setSession(null)
    setQuestion(null)
    setChosen(undefined)
  }

  if (phase === 'config') {
    return (
      <Page title="Jogar" subtitle="Escolha a categoria e o número de questões. Tem 15 segundos para cada pergunta.">
        <Alert>{error || (catError && friendlyError(catError))}</Alert>

        <fieldset className="choice-group">
          <legend>Categoria</legend>
          <div className="category-grid">
            {categories.map((c, i) => (
              <button
                key={c.slug}
                type="button"
                className={`category-card cat-${i % 4} ${category === c.slug ? 'is-active' : ''}`}
                aria-pressed={category === c.slug}
                onClick={() => setCategory(c.slug)}
              >
                <strong>{c.name}</strong>
                {c.description && <span>{c.description}</span>}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-group">
          <legend>Número de questões</legend>
          <div className="choice-row">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                className={count === n ? 'choice choice-round is-active' : 'choice choice-round'}
                aria-pressed={count === n}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="start-bar">
          <button className="btn btn-lg" onClick={start} disabled={!categories.length}>
            Iniciar quiz
          </button>
          {!user && (
            <p className="hint">
              Está a jogar como visitante. <Link to="/registar">Crie uma conta</Link> para entrar no ranking.
            </p>
          )}
        </div>
      </Page>
    )
  }

  if (phase === 'result') {
    return (
      <Result
        score={score}
        total={total}
        log={log}
        category={category}
        categoryName={categories.find((c) => c.slug === category)?.name ?? ''}
        user={user}
        profile={profile}
        onRestart={restart}
      />
    )
  }

  if (!question) {
    return (
      <div className="game">
        <div className="game-stage"><Spinner /></div>
      </div>
    )
  }

  return (
    <GameScreen
      question={question}
      phase={phase}
      timeLeft={timeLeft}
      chosen={chosen}
      error={error}
      categoryName={categories.find((c) => c.slug === category)?.name ?? ''}
      onAnswer={answer}
      onExit={restart}
    />
  )
}
