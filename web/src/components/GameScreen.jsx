import { useEffect } from 'react'
import { Alert } from './ui'

const LETTERS = 'ABCD'

// Cronómetro em anel: esvazia-se de forma contínua; o número muda a cada segundo.
function TimerRing({ startLeft, timeLeft, running, timedOut }) {
  const level = timeLeft <= 5 ? 'is-danger' : timeLeft <= 10 ? 'is-warn' : ''
  return (
    <div
      className={`timer-ring ${level} ${running ? '' : 'is-paused'}`}
      style={{ '--from': `${((15 - startLeft) / 15) * 100}`, '--dur': `${startLeft}s` }}
      role="timer"
      aria-label={`${timeLeft} segundos`}
    >
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle className="timer-track" cx="26" cy="26" r="22" pathLength="100" />
        <circle className="timer-fill" cx="26" cy="26" r="22" pathLength="100" />
      </svg>
      <span className="timer-num" key={timedOut ? 'out' : timeLeft}>{timedOut ? 0 : timeLeft}</span>
    </div>
  )
}

// Progresso: perguntas já respondidas, a atual e as que faltam (sem revelar certo/errado).
function Segments({ total, current, answered }) {
  return (
    <ol className="segments" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const done = i < current - 1 || (i === current - 1 && answered)
        return <li key={i} className={done ? 'seg is-done' : i === current - 1 ? 'seg is-current' : 'seg'} />
      })}
    </ol>
  )
}

export default function GameScreen({ question, phase, timeLeft, chosen, feedback, score, error, categoryName, onAnswer, onNext, onExit }) {
  const live = phase === 'question'
  const answered = chosen !== undefined
  const timedOut = chosen === null

  // Teclado: 1–4 ou A–D para responder
  useEffect(() => {
    if (!live) return
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      let i = '1234'.indexOf(k)
      if (i < 0) i = 'abcd'.indexOf(k)
      if (i >= 0 && i < question.q_options.length) onAnswer(i)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [live, question, onAnswer])

  return (
    <div className={`game ${phase === 'loading' ? 'is-busy' : ''}`}>
      <div className="game-bar">
        <div className="container game-bar-row">
          <button className="link-btn" onClick={onExit}>← Sair</button>
          <div className="game-meta">
            <span className="game-cat">{categoryName}</span>
            <span className="quiz-progress">
              <strong>{question.q_position}</strong> / {question.q_total}
            </span>
          </div>
          <TimerRing key={question.q_position} startLeft={question.q_time_left} timeLeft={timeLeft} running={live} timedOut={timedOut} />
        </div>
        <div className="container">
          <Segments total={question.q_total} current={question.q_position} answered={answered} />
        </div>
      </div>

      <div className="game-stage">
        <div className="container q-enter" key={question.q_position}>
          <p className="q-kicker">Pergunta {question.q_position}</p>
          <h1 className="question">{question.q_text}</h1>

          <ul className={answered ? 'answers is-locked' : 'answers'}>
            {question.q_options.map((opt, i) => {
              let cls = 'answer'
              let mark = LETTERS[i]
              if (feedback) {
                // Depois da resposta do servidor: certa a verde, errada a vermelho
                if (i === feedback.correctIndex) { cls += ' is-correct'; mark = '✓' }
                else if (i === chosen) { cls += ' is-wrong'; mark = '✗' }
                else cls += ' is-dim'
              } else if (answered) cls += i === chosen ? ' is-chosen' : ' is-dim'
              return (
                <li key={i}>
                  <button className={cls} onClick={() => onAnswer(i)} disabled={!live} aria-pressed={i === chosen}>
                    <span className="answer-letter" aria-hidden="true">{mark}</span>
                    <span className="answer-text">{opt}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <Alert>{error}</Alert>

          {feedback ? (
            <div className={feedback.correct ? 'verdict is-good' : timedOut ? 'verdict is-time' : 'verdict is-bad'} role="status">
              <span className="verdict-icon" aria-hidden="true">{feedback.correct ? '✓' : timedOut ? '⏱' : '✗'}</span>
              <div>
                <strong>{feedback.correct ? 'Certo!' : timedOut ? 'O tempo acabou.' : 'Não foi desta.'}</strong>
                {feedback.explanation && <p>{feedback.explanation}</p>}
              </div>
            </div>
          ) : (
            <p className="game-status">
              {!answered && <span className="key-hint">Toque numa opção <span className="kbd-hint">ou use as teclas 1–4</span></span>}
            </p>
          )}
        </div>
      </div>

      <div className="game-foot">
        <div className="container game-bar-row">
          <div className="score-box">
            <span className="score-label">Pontos</span>
            <strong className="score-num" key={score}>{score}</strong>
          </div>
          {feedback && (
            <button className="btn btn-lg btn-next" onClick={onNext} autoFocus>
              {feedback.finished ? 'Ver resultado' : 'Próxima →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
