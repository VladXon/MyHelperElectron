import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="app">
          <div className="loading-screen">
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 8, fontSize: 16 }}>
              Что-то пошло не так
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16, maxWidth: 360, textAlign: 'center' }}>
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
            <button
              className="settings-btn settings-btn-primary"
              onClick={this.handleReload}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
