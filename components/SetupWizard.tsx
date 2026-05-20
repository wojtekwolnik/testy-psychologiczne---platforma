'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setupApplication } from '@/app/actions/setup';
import { ArrowRight, CheckCircle2, ShieldCheck, Mail, Lock, Settings } from 'lucide-react';

export default function SetupWizard() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const res = await setupApplication(formData);

        if (!res.success) {
            setError(res.error || 'Nieznany błąd');
            setIsLoading(false);
        } else {
            setStep(3); // Success step
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-slate-100 font-sans">
            <div className="w-full max-w-lg">
                
                {/* Header */}
                <div className="text-center mb-8 transform transition-all duration-700 ease-out translate-y-0 opacity-100">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                        <Settings className="w-10 h-10 text-white animate-[spin_4s_linear_infinite]" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        Testy Psychologiczne
                    </h1>
                    <p className="mt-3 text-slate-400 text-lg">
                        Kreator pierwszej konfiguracji
                    </p>
                </div>

                {/* Card Container */}
                <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 overflow-hidden relative">
                    
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"></div>

                    {/* Step 1: Welcome */}
                    <div className={`transition-all duration-500 ease-in-out absolute w-[calc(100%-4rem)] ${step === 1 ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-full pointer-events-none'}`}>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <ShieldCheck className="text-blue-400 w-8 h-8" />
                            Witaj w systemie!
                        </h2>
                        <p className="text-slate-300 mb-6 leading-relaxed">
                            Aplikacja została pomyślnie zainstalowana na Twoim serwerze. Zanim rozpoczniesz pracę, musimy utworzyć główne konto administratora.
                        </p>
                        <button 
                            onClick={() => setStep(2)}
                            className="w-full group bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                        >
                            Rozpocznij konfigurację
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Step 2: Form */}
                    <div className={`transition-all duration-500 ease-in-out ${step === 2 ? 'opacity-100 translate-x-0' : step < 2 ? 'opacity-0 translate-x-full absolute w-[calc(100%-4rem)] top-8' : 'opacity-0 -translate-x-full absolute w-[calc(100%-4rem)] top-8'} ${step !== 2 && 'pointer-events-none'}`}>
                        <h2 className="text-2xl font-bold mb-6">Konto administratora</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Adres e-mail</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <input 
                                        name="email" 
                                        type="email" 
                                        required 
                                        placeholder="admin@twojadomena.pl"
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Silne hasło</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <input 
                                        name="password" 
                                        type="password" 
                                        required 
                                        minLength={8}
                                        placeholder="Min. 8 znaków"
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    {error}
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                                >
                                    Wstecz
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Utwórz konto'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Step 3: Success */}
                    <div className={`transition-all duration-500 ease-in-out text-center ${step === 3 ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-full absolute w-[calc(100%-4rem)] top-8 pointer-events-none'}`}>
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-white">Sukces!</h2>
                        <p className="text-slate-300 mb-6">
                            Konto administratora zostało pomyślnie utworzone. Za chwilę zostaniesz przekierowany do strony logowania.
                        </p>
                        <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto" />
                    </div>

                </div>
            </div>
        </div>
    );
}
