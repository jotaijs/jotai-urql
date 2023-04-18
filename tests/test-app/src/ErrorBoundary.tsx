import React, { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component<
  {
    message?: string
    retry?: () => void | Promise<void>
    children: ReactNode
  },
  { hasError: boolean }
> {
  constructor(props: { message?: string; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    return this.state.hasError ? (
      <div>
        {this.props.message || 'errored'}
        {this.props.retry && (
          <button
            onClick={async () => {
              await this.props.retry?.()
              this.setState({ hasError: false })
            }}>
            retry
          </button>
        )}
      </div>
    ) : (
      this.props.children
    )
  }
}
