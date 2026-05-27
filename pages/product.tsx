"use client"

import { FormEvent, useState } from 'react';
import { PricingTable, Show, UserButton, useAuth } from '@clerk/nextjs';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import DatePicker from 'react-datepicker';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

function ConsultationForm() {
    const { getToken } = useAuth();
    const [patientName, setPatientName] = useState('');
    const [visitDate, setVisitDate] = useState<Date | null>(new Date());
    const [notes, setNotes] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setOutput('');
        setLoading(true);

        const jwt = await getToken();
        if (!jwt) {
            setOutput('Autenticacion requerida.');
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        let buffer = '';

        try {
            await fetchEventSource('/api', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    patient_name: patientName,
                    date_of_visit: visitDate?.toISOString().slice(0, 10),
                    notes,
                }),
                onmessage(message) {
                    if (message.event === 'done') {
                        controller.abort();
                        setLoading(false);
                        return;
                    }

                    if (message.event === 'app-error') {
                        setOutput(message.data || 'Ocurrio un error generando el resumen.');
                        controller.abort();
                        setLoading(false);
                        return;
                    }

                    buffer += message.data;
                    setOutput(buffer);
                },
                onclose() {
                    setLoading(false);
                },
                onerror(error) {
                    console.error('SSE error:', error);
                    controller.abort();
                    setOutput('Error de conexion. Intenta de nuevo.');
                    setLoading(false);
                },
            });
        } catch (error) {
            if (!controller.signal.aborted) {
                console.error('Request error:', error);
                setOutput('Error de conexion. Intenta de nuevo.');
                setLoading(false);
            }
        }
    }

    return (
        <div className="container mx-auto max-w-3xl px-4 py-12">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    Resumen de consulta
                </h1>
                <p className="mt-3 text-gray-600 dark:text-gray-400">
                    Convierte notas medicas en un resumen profesional, proximos pasos y un correo claro para el paciente.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
                <div className="space-y-2">
                    <label htmlFor="patient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre del paciente
                    </label>
                    <input
                        id="patient"
                        type="text"
                        required
                        value={patientName}
                        onChange={(event) => setPatientName(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Nombre completo del paciente"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha de la consulta
                    </label>
                    <DatePicker
                        id="date"
                        selected={visitDate}
                        onChange={(date: Date | null) => setVisitDate(date)}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Selecciona una fecha"
                        required
                        wrapperClassName="w-full"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notas de la consulta
                    </label>
                    <textarea
                        id="notes"
                        required
                        rows={8}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Escribe aqui las notas detalladas de la consulta..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {loading ? 'Generando resumen...' : 'Generar resumen'}
                </button>
            </form>

            {output && (
                <section className="mt-8 rounded-xl bg-gray-50 p-8 shadow-lg dark:bg-gray-800">
                    <div className="markdown-content prose prose-blue max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {output}
                        </ReactMarkdown>
                    </div>
                </section>
            )}
        </div>
    );
}

function SubscriptionFallback() {
    return (
        <div className="container mx-auto px-4 py-12">
            <header className="mb-12 text-center">
                <h1 className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-5xl font-bold text-transparent">
                    Plan profesional de salud
                </h1>
                <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
                    Optimiza tus consultas con resumenes generados por IA.
                </p>
            </header>
            <div className="mx-auto max-w-4xl">
                <PricingTable />
            </div>
        </div>
    );
}

export default function Product() {
    return (
        <main className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="absolute right-4 top-4 z-10">
                <UserButton showName />
            </div>

            <Show when={{ plan: 'premium_subscription' }} fallback={<SubscriptionFallback />}>
                <ConsultationForm />
            </Show>
        </main>
    );
}
