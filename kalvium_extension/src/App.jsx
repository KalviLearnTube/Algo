import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import Onboard from './pages/onboard'
import Hero from './pages/hero'
import Unique_hero from './pages/unique_hero'
// import "./index.css"

function App() {


  return (
    <HashRouter>
      {/* <Link to={"/onboard"}>onboard</Link> */}
      {/* top header */}
      <Routes>
        <Route path='/onboard' element={<Onboard />} />
        <Route path='/hero' element={<Hero />} />
        <Route path='/hero/:id' element={<Unique_hero />} />
      </Routes>
      {/* bottom menu */}
    </HashRouter>
  )
}

export default App