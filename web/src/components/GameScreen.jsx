import { useEffect } from 'react'
import { Alert } from './ui'

const LETTERS = 'ABCD'
const BURST = ['#12b03f', '#f4c430', '#c31402', '#ffffff', '#12b03f', '#f4c430', '#c31402', '#ffffff', '#12b03f', '#f4c430']

// Cronómetro em anel: o anel esvazia-se de forma contínua (CSS), o número muda a cada segundo.
function TimerRing({ startLeft, timeLeft, running, timedOut }) {
  const level = timeLeft <= 5 ? 'is-danger' : timeLeft <= 10 ? 'is-warn' : ''
  return (
    <div
      className={`timer-ring ${level} ${running ? '' : 'is-paused'} ${timedOut ? 'is-out' : ''}`}
      style={{ '--from': `${((15 - startLeft) / 15) * 100}`, '--dur': `${startLeft}s` }}
      role="timer"
      aria-live="off"
      aria-label={`${timeLeft} segundos`}
    >
      <svg viewBox="0 0 52 52" aria-hidden="true">
        <circle className="timer-track" cx="26" cy="26" r="22" pathLength="100" />
        <circle className="timer-fill" cx="26" cy="26" r="22" pathLength="100" />
      </svg>
      <span className="timer-num" key={timedOut ? 'out' : timeLeft}>
        {timedOut ? '0' : timeLeft}
      </span>
    </div>
  )
}

// Barra de progresso em segmentos: cada pergunta respondida fica com a cor do resultado.
function Segments({ total, log, current, live }) {
  return (
    <ol className="segments" aria-label={`Pergunta ${current} de ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const r = log[i]?.result
        const cls = r ? `seg is-${r}` : i === current - 1 && live ? 'seg is-current' : 'seg'
        return <li key={i} className={cls} />
      })}
    </ol>
  )
}

export default function GameScreen({ question, phase, timeLeft, feedback, score, streak, log, error, categoryName, onAnswer, onNext, onExit }) {
  const live = phase === 'question'
  const timedOut = feedback?.chosen === null

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
          <TimerRing
            key={question.q_position}
            startLeft={question.q_time_left}
            timeLeft={timeLeft}
            running={live}
            timedOut={timedOut}
          />
        </div>
        <div className="container">
          <Segments total={question.q_total} log={log} current={question.q_position} live={live} />
        </div>
      </div>

      <div className="game-stage">
        <div className="container q-enter" key={question.q_position}>
          <p className="q-kicker">Pergunta {question.q_position}</p>
          <h1 className="question">{question.q_text}</h1>

          <ul className={feedback ? 'answers is-revealed' : 'answers'}>
            {question.q_options.map((opt, i) => {
              let cls = `answer letter-${i}`
              let mark = LETTERS[i]
              if (feedback) {
                if (i === feedback.correctIndex) {
                  cls += ' is-correct'
                  mark = '✓'
                } else if (i === feedback.chosen) {
                  cls += ' is-wrong'
                  mark = '✗'
                } else cls += ' is-dim'
              }
              return (
                <li key={i}>
                  <button className={cls} onClick={() => onAnswer(i)} disabled={!live}>
                    <span className="answer-letter" aria-hidden="true">{mark}</span>
                    <span className="answer-text">{opt}</span>
                    {feedback?.correct && i === feedback.correctIndex && (
                      <span className="burst" aria-hidden="true">
                        {BURST.map((c, n) => (
                          <i key={n} style={{ '--a': `${n * 36}deg`, '--c': c }} />
                        ))}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <Alert>{error}</Alert>

          {feedback && (
            <div className={feedback.correct ? 'verdict is-good' : timedOut ? 'verdict is-time' : 'verdict is-bad'} role="status">
              <span className="verdict-icon" aria-hidden="true">{feedback.correct ? '✓' : timedOut ? '⏱' : '✗'}</span>
              <div>
                <strong>{feedback.correct ? 'Certo!' : timedOut ? 'O tempo acabou.' : 'Não foi desta.'}</strong>
                {feedback.explanation && <p>{feedback.explanation}</p>}
              </div>
            </div>
          )}

          {live && <p className="key-hint">Dica: use as teclas 1–4 ou A–D.</p>}
        </div>
      </div>

      <div className="game-foot">
        <div className="container game-bar-row">
          <div className="score-box">
            <span className="score-label">Pontos</span>
            <strong className="score-num" key={score}>{score}</strong>
            {feedback?.correct && <span className="plus-one" key={question.q_position}>+1</span>}
            {streak >= 2 && (
              <span className="streak" key={`s${streak}`}>
                🔥 {streak} seguidas
              </span>
            )}
          </div>
          {phase === 'answered' && (
            <button className="btn btn-lg btn-next" onClick={onNext} autoFocus>
              {feedback?.finished ? 'Ver resultado' : 'Próxima →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
