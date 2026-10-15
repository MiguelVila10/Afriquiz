import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, friendlyError } from '../lib/supabase'
import { useCategories } from '../lib/categories'
import { useAuth } from '../lib/auth'
import { Alert, Page, Spinner } from '../components/ui'
import Result from '../components/Result'

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
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const sending = useRef(false)
  const shownAt = useRef(0) // momento (ms) em que a pergunta apareceu, já descontando o tempo gasto
  const [log, setLog] = useState([]) // histórico desta partida para o gráfico final

  const loadNext = useCallback(async (sessionId) => {
    setPhase('loading')
    setFeedback(null)
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
    setQuestion(q)
    setTotal(q.q_total)
    setTimeLeft(q.q_time_left)
    shownAt.current = performance.now() - (15 - q.q_time_left) * 1000
    sending.current = false
    setPhase('question')
  }, [])

  const answer = useCallback(
    async (choice) => {
      if (sending.current) return
      sending.current = true
      const { data, error } = await supabase.rpc('answer_question', { p_session: session, p_choice: choice })
      if (error) {
        setError(friendlyError(error))
        sending.current = false
        return
      }
      const r = data[0]
      const timedOut = choice === null
      const secs = timedOut ? 15 : Math.min(15, Math.round((performance.now() - shownAt.current) / 100) / 10)
      setLog((l) => [
        ...l,
        { position: question.q_position, text: question.q_text, seconds: secs, result: timedOut ? 'timeout' : r.r_correct ? 'correct' : 'wrong' },
      ])
      setFeedback({ chosen: choice, correct: r.r_correct, correctIndex: r.r_correct_index, explanation: r.r_explanation, finished: r.r_finished })
      setScore(r.r_score)
      setPhase('answered')
    },
    [session, question]
  )

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

  function next() {
    if (feedback?.finished) setPhase('result')
    else loadNext(session)
  }

  function restart() {
    setPhase('config')
    setSession(null)
    setQuestion(null)
    setFeedback(null)
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

  if (phase === 'loading' || !question) {
    return (
      <div className="game">
        <div className="game-stage"><Spinner /></div>
      </div>
    )
  }

  const urgent = phase === 'question' && timeLeft <= 5
  return (
    <div className="game">
      <div className="game-bar">
        <div className="container game-bar-row">
          <button className="link-btn" onClick={restart}>← Sair</button>
          <span className="quiz-progress">
            Pergunta <strong>{question.q_position}</strong> de <strong>{question.q_total}</strong>
          </span>
          <span className={urgent ? 'timer is-urgent' : 'timer'} aria-live="polite">
            {feedback?.chosen === null ? 'Tempo!' : `${timeLeft}s`}
          </span>
        </div>
        <div className="progress" aria-hidden="true">
          <div className="progress-bar" style={{ '--p': `${((question.q_position - (phase === 'answered' ? 0 : 1)) / question.q_total) * 100}%` }} />
        </div>
      </div>

      <div className="game-stage">
        <div className="container q-enter" key={question.q_position}>
          <h1 className="question">{question.q_text}</h1>

          <ul className="answers">
            {question.q_options.map((opt, i) => {
              let cls = 'answer'
              if (feedback) {
                if (i === feedback.correctIndex) cls += ' is-correct'
                else if (i === feedback.chosen) cls += ' is-wrong'
              }
              return (
                <li key={i}>
                  <button className={cls} onClick={() => answer(i)} disabled={phase !== 'question'}>
                    <span className="answer-letter" aria-hidden="true">{'ABCD'[i]}</span>
                    {opt}
                  </button>
                </li>
              )
            })}
          </ul>

          <Alert>{error}</Alert>

          {feedback && (
            <div className={feedback.correct ? 'verdict is-good' : 'verdict is-bad'} role="status">
              <strong>
                {feedback.correct ? 'Certo!' : feedback.chosen === null ? 'O tempo acabou.' : 'Não foi desta.'}
              </strong>
              {feedback.explanation && <p>{feedback.explanation}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="game-foot">
        <div className="container game-bar-row">
          <span>Pontos: <strong>{score}</strong></span>
          {phase === 'answered' && (
            <button className="btn btn-lg" onClick={next} autoFocus>
              {feedback?.finished ? 'Ver resultado' : 'Próxima'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
