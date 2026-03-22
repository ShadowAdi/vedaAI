'use client';

import Link from 'next/link';
import { Zap, Brain, BarChart3, FileText, Clock, CheckCircle } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Questions',
      description: 'Generate custom assignments using advanced AI technology',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Live progress tracking with WebSocket technology',
    },
    {
      icon: FileText,
      title: 'Multiple Question Types',
      description: 'MCQ, Short, Long, Numerical, Diagrams, True/False',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'Track difficulty levels and mark distribution',
    },
    {
      icon: Clock,
      title: 'Due Date Management',
      description: 'Set deadlines and organize assignments',
    },
    {
      icon: CheckCircle,
      title: 'PDF Export',
      description: 'Download assignments as professional PDFs',
    },
  ];

  const stats = [
    { number: '∞', label: 'Custom Assignments' },
    { number: '6+', label: 'Question Types' },
    { number: '100%', label: 'AI Generated' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <nav className="sticky top-0 z-50 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-orange-500">
              VedaAI
            </div>
            <div className="flex gap-4">
              <Link
                href="/assignments"
                className="px-4 py-2 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Assignments
              </Link>
              <Link
                href="/assignments/create"
                className="px-4 py-2 rounded-lg font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Create New
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-black dark:text-white leading-tight">
            AI-Powered <span className="text-orange-500">Assignment Generator</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            Create unlimited custom assignments with AI in seconds. Choose question types, set marks,
            and let our intelligent system generate perfectly tailored assessments.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/assignments/create"
              className="px-8 py-4 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-all"
            >
              Start Creating →
            </Link>
            <Link
              href="/assignments"
              className="px-8 py-4 rounded-lg font-semibold border-2 border-zinc-300 dark:border-zinc-700 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              View All Assignments
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 py-16 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-orange-500">
                  {stat.number}
                </div>
                <div className="text-lg text-zinc-600 dark:text-zinc-400 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Everything you need to create professional assignments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-orange-500/10 hover:shadow-orange-500/10 transition-all"
              >
                <Icon className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white dark:bg-zinc-900 py-20 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Select Types', desc: 'Choose question types and count' },
              { step: '2', title: 'Upload Content', desc: 'Upload reference material (optional)' },
              { step: '3', title: 'Configure', desc: 'Set marks, difficulty, and instructions' },
              { step: '4', title: 'Generate', desc: 'AI creates custom assignment instantly' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-black dark:text-white mb-2">{item.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
            Built with Modern Tech
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Leveraging cutting-edge technologies for the best experience
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-6 text-center">
          {['Next.js', 'TypeScript'].map((tech, idx) => (
            <div
              key={idx}
              className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300"
            >
              {tech}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-orange-500 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to create assignments?</h2>
          <p className="text-orange-100 text-lg mb-8">Start generating AI-powered assessments today</p>
          <Link
            href="/assignments/create"
            className="inline-block px-8 py-4 rounded-lg font-semibold bg-white text-orange-500 hover:bg-orange-50 transition-colors"
          >
            Create Your First Assignment →
          </Link>
        </div>
      </section>

      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-600 dark:text-zinc-400">
          <p>VedaAI © 2026. AI-Powered Assignment Generation Platform.</p>
        </div>
      </footer>
    </div>
  );
}
