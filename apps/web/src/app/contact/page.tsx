import Link from 'next/link';
import { Mail, Github, MessageSquare, BookOpen, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-12">

      {/* Header */}
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Get in touch</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Have a question, suggestion, or found a bug? We would love to hear from you.
        </p>
      </section>

      {/* Contact cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Github,
            title: 'GitHub',
            desc: 'Report bugs or request features',
            label: 'Open an issue',
            href: 'https://github.com/dsasuite,
            color: 'text-gray-700 dark:text-gray-300',
            bg: 'bg-gray-50 dark:bg-gray-900/20',
          },
          {
            icon: Mail,
            title: 'Email',
            desc: 'For general enquiries',
            label: 'admin@dsasuite.com',
            href: 'mailto:dsasuite@gmail.com',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
          },
          {
            icon: MessageSquare,
            title: 'Instagram',
            desc: 'Suggest topics or improvements',
            label: 'Submit feedback',
            href: 'https://www.instagram.com/dsa_suite/',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
          },
        ].map(c => (
          <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer"
            className="group flex flex-col gap-4 p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.color} flex items-center justify-center`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
            </div>
            <span className={`text-xs font-medium ${c.color} flex items-center gap-1 group-hover:gap-2 transition-all mt-auto`}>
              {c.label} <ArrowRight className="w-3 h-3" />
            </span>
          </a>
        ))}
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Frequently asked questions</h2>
        <div className="space-y-3">
          {[
            {
              q: 'Is DSA Suite free?',
              a: 'Yes, DSA Suite is completely free. All topics, editorials, progress tracking and bookmarks are available without any payment.',
            },
            {
              q: 'How do I report a mistake in an editorial?',
              a: 'Open an issue on our GitHub repository with the topic name and the correction. We review and update editorials regularly.',
            },
            {
              q: 'Can I contribute content?',
              a: 'Absolutely! We welcome contributions. You can fork the repository, write an editorial in markdown, and submit a pull request.',
            },
            {
              q: 'How do I request a new topic?',
              a: 'Create a GitHub discussion or open an issue with the topic you want covered. We prioritize based on community demand.',
            },
            {
              q: 'Is there a mobile app?',
              a: 'Not yet, but the website is fully responsive and works great on mobile browsers. A PWA version is planned.',
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h3 className="font-semibold text-sm">{item.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white p-8 text-center space-y-4">
        <BookOpen className="w-8 h-8 text-indigo-300 mx-auto" />
        <h2 className="text-xl font-bold">Ready to start learning?</h2>
        <p className="text-indigo-200 text-sm">
          Join thousands of learners mastering DSA, CP and GATE CSE.
        </p>
        <Link href="/signup"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
          Get started free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

    </main>
  );
}
