import { useState } from 'react'
import { embedUrl, thumbUrl } from '../lib/youtube'

// Mostra a miniatura com um botão de play; o leitor do YouTube só carrega quando se carrega
// (página mais leve e sem cookies do YouTube até a pessoa decidir ver).
export default function VideoPlayer({ id, title }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="player">
      {playing ? (
        <iframe
          src={embedUrl(id)}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button className="player-cover" onClick={() => setPlaying(true)} aria-label={`Ver vídeo: ${title}`}>
          <img src={thumbUrl(id, 'hqdefault')} alt="" />
          <span className="play-btn" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
