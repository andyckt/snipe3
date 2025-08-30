"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): { hasError: boolean, error: Error } {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    })
    
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-white p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-6 text-gray-600">
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.reload()}
              variant="default"
            >
              Refresh Page
            </Button>
            <Button 
              onClick={this.resetError}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
          
          {/* Only show error details in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-64 w-full">
              <p className="font-mono text-sm text-red-600 mb-2">
                {this.state.error?.toString()}
              </p>
              <p className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
