import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-[#050508] flex flex-col items-center justify-center p-6 text-center z-[9999]">
                    <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 border border-red-500/30">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-black text-white mb-4 italic uppercase">Oups ! Une erreur est survenue</h1>
                    <p className="text-white/60 mb-8 max-w-sm">
                        L'application a rencontré un problème inattendu. Essayez de recharger la page.
                    </p>
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-8 w-full max-w-md overflow-auto text-left">
                        <p className="text-red-400 font-mono text-xs break-all">
                            {this.state.error?.toString()}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                    >
                        Recharger la page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
