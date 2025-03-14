import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { fetchYouTubeHistory , getGoogleAuthToken} from './services/oauth'

function App() {
  const [count, setCount] = useState(0)
  const [history, setHistory] = useState([])

  const fetchAndDisplayHistory = async () => {
    try {
      const token = await getGoogleAuthToken()
      const historyData = await fetchYouTubeHistory(token)
      console.log(historyData)
      setHistory(historyData)
    } catch (error) {
      console.error('Error fetching YouTube history:', error)
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={fetchAndDisplayHistory}>
          Fetch YouTube History
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      {history.length > 0 && (
        <div>
          <h2>Recent Watch History:</h2>
          <ul>
            {history.map((item, index) => (
              <li key={index}>{item.snippet.title}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default App