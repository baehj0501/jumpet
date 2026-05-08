import { useEffect, useState } from 'react'

export const App = () => {
  const [pong, setPong] = useState<string>('')

  useEffect(() => {
    window.api.ping().then(setPong)
  }, [])

  return (
    <main className="app">
      <h1>Game</h1>
      <p>Electron + React + TypeScript + Vite</p>
      <p className="ipc">
        IPC ping result: <strong>{pong || '...'}</strong>
      </p>
    </main>
  )
}
