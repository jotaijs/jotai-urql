import React from 'react'
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { CacheAndMutations } from './CacheAndMutations'
import { Paused } from './Paused'
import { SmokeTest } from './SmokeTest'
import { SuspenseDisabled } from './SuspenseDisabled'

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
            <li>
              <Link to="/suspense-disabled">Suspense Disabled</Link>
            </li>
            <li>
              <Link to="/paused">Paused</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" Component={() => <>Empty</>}></Route>
          <Route path="/smoke" Component={SmokeTest} />
          <Route path="/mutations" Component={CacheAndMutations} />
          <Route path="/suspense-disabled" Component={SuspenseDisabled} />
          <Route path="/paused" Component={Paused} />
        </Routes>
      </div>
    </Router>
  )
}
