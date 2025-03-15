import './App.css'
import { Route, Router, Routes } from 'react-router-dom'
import Onboard from './pages/onboard'
import Hero from './pages/hero'
import Unique_hero from './pages/unique_hero'

function App() {


  return (
    <Router>
      {/* top header */}
      <Routes>
        <Route path='' element={<Onboard />} />
        <Route path='' element={<Hero />} />
        <Route path='' element={<Unique_hero />} />
      </Routes>
      {/* bottom menu */}
    </Router>
  )
}

export default App