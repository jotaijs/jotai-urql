import React from 'react'
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { CacheAndMutations } from './CacheAndMutations'
import { SmokeTest } from './SmokeTest'

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/smoke">Smoke</Link>
            </li>
            <li>
              <Link to="/mutations">Mutations</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/">
            <>Empty</>
          </Route>
          <Route path="/smoke" Component={SmokeTest} />
          <Route path="/mutations" Component={CacheAndMutations} />
        </Routes>
      </div>
    </Router>
  )
}
