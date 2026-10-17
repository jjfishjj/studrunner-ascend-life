import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'

async function boot() {
  if (import.meta.env.DEV) {
    const [{ registerGameTuning }, { tuning }] = await Promise.all([
      import('../scripts/manus-tuning/adapter.js'), import('./game/tuning'),
    ])
    await registerGameTuning(tuning)
  }
  // 3D 場景擁有自己的資源生命週期，不使用 StrictMode 的雙重掛載以避免重複建立 WebGL 資源。
  void StrictMode
  createRoot(document.getElementById('root')!).render(<App />)
}

void boot()
