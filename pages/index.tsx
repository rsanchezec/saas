"use client"

import Link from 'next/link';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

const features = [
  {
    title: 'Resúmenes profesionales',
    description: 'Genera resúmenes claros para el historial clínico a partir de tus notas.',
    icon: 'M',
    accent: 'from-blue-600 to-cyan-600',
  },
  {
    title: 'Próximos pasos',
    description: 'Obtén acciones de seguimiento concretas para cada consulta.',
    icon: 'S',
    accent: 'from-emerald-600 to-green-600',
  },
  {
    title: 'Correos al paciente',
    description: 'Redacta comunicaciones simples y comprensibles para tus pacientes.',
    icon: '@',
    accent: 'from-indigo-600 to-violet-600',
  },
];

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <nav className="mb-12 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            MediNotes Pro
          </h1>
          <div>
            {isLoaded && !isSignedIn && (
              <SignInButton mode="modal">
                <button className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700">
                  Iniciar sesión
                </button>
              </SignInButton>
            )}
            {isLoaded && isSignedIn && (
              <div className="flex items-center gap-4">
                <Link
                  href="/product"
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Ir a la app
                </Link>
                <UserButton showName />
              </div>
            )}
          </div>
        </nav>

        <section className="py-16 text-center">
          <h2 className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl">
            Transforma tus
            <br />
            notas de consulta
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl text-gray-600 dark:text-gray-400">
            Asistente con IA para generar resúmenes profesionales, próximos pasos y correos para pacientes a partir de tus notas clínicas.
          </p>

          <div className="mx-auto mb-12 grid max-w-4xl gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="relative">
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${feature.accent} opacity-20 blur transition duration-300`} />
                <div className="relative h-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className={`mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r ${feature.accent} text-sm font-bold text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:from-blue-700 hover:to-indigo-700 hover:scale-105">
                Empezar prueba gratis
              </button>
            </SignInButton>
          )}
          {isLoaded && isSignedIn && (
            <Link href="/product">
              <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:from-blue-700 hover:to-indigo-700 hover:scale-105">
                Acceder a funciones premium
              </button>
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
