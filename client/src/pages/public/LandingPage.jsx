import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Icon from '../../components/Icon';
import { Avatar, SkeletonCards, Stars, VerifiedBadge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

const steps = [
  {
    icon: 'clipboard',
    title: 'Describe the problem',
    text: 'Choose the appliance, add up to five photos and pick a preferred visit window.',
  },
  {
    icon: 'wrench',
    title: 'Pick your technician',
    text: 'Browse verified pros by skill, area and rating, or leave the job open to any of them.',
  },
  {
    icon: 'route',
    title: 'Track the visit',
    text: 'Chat, follow the live status timeline and see your technician approaching on the map.',
  },
  {
    icon: 'star',
    title: 'Rate the repair',
    text: 'Pay only after the work is done, then leave a review that helps the next customer.',
  },
];

const faqs = [
  {
    q: 'How are technicians verified?',
    a: 'Technicians submit a government ID, a selfie with that ID, a skill certificate and a clearance. An admin reviews everything before the verified badge is shown.',
  },
  {
    q: 'When and how do I pay?',
    a: 'You pay the technician directly after the repair is completed. The final cost and parts used are recorded in your request details.',
  },
  {
    q: 'Can I reschedule or cancel?',
    a: 'Yes. Customers can reschedule or cancel from the request page any time before the technician is on the way.',
  },
  {
    q: 'What if I lose internet while booking?',
    a: 'FixitNow is a progressive web app. You can draft and queue a service request offline; it is sent automatically once you reconnect.',
  },
];

export default function LandingPage() {
  const { data: meta } = useQuery({
    queryKey: ['technicians', 'meta'],
    queryFn: () => api.get('/technicians/meta').then((res) => res.data.data),
  });
  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['technicians', 'featured'],
    queryFn: () =>
      api
        .get('/technicians', { params: { featured: 'true', limit: 4, sort: 'rating' } })
        .then((res) => res.data.data),
  });
  const { data: allTechs } = useQuery({
    queryKey: ['technicians', 'landing-stats'],
    queryFn: () =>
      api.get('/technicians', { params: { limit: 100, sort: 'rating' } }).then((res) => res.data.data),
  });

  const verifiedCount = allTechs?.meta?.total || 0;
  const totalReviews = (allTechs?.items || []).reduce(
    (sum, tech) => sum + Number(tech.reviewCount || 0),
    0
  );
  const weighted = (allTechs?.items || []).reduce(
    (sum, tech) => sum + Number(tech.avgRating || 0) * Number(tech.reviewCount || 0),
    0
  );
  const averageRating = totalReviews ? (weighted / totalReviews).toFixed(1) : 'New';

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-amber-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-100">
              <Icon name="badge-check" className="h-4 w-4 text-amber-300" />
              Every pro is document-verified
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Broken appliance?
              <span className="mt-1 block bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                Fixed right, fixed fast.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Book verified appliance technicians in your area. Track every step, chat in real
              time, and only settle up when the job is done.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary bg-amber-400 text-slate-950 hover:bg-amber-300">
                Book a repair
                <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
              <Link
                to="/technicians"
                className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                Browse technicians
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-brand-300" /> Verified identity</span>
              <span className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-brand-300" /> No booking fee</span>
              <span className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-brand-300" /> Pay after service</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <img
              src="/images/hero.svg"
              alt="Illustration of a verified appliance technician"
              className="w-full rounded-3xl shadow-2xl"
            />
            <div className="absolute -bottom-5 left-4 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Icon name="badge-check" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Verified technician</p>
                <p className="text-[11px] text-slate-500">ID, skills and clearance checked</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 sm:px-6">
          {[
            { label: 'Verified technicians', value: verifiedCount },
            { label: 'Customer reviews', value: totalReviews },
            { label: 'Average rating', value: averageRating === 'New' ? 'New' : `${averageRating}/5` },
            { label: 'Booking fee', value: '₱0' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">What we fix</p>
            <h2 className="section-title mt-2">Popular appliance services</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Specialists for the machines your home depends on, from split-type aircons to tricky
              small appliances.
            </p>
          </div>
          <Link to="/technicians" className="btn-secondary">
            See all technicians
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(meta?.categories || [])
            .filter((category) => category.isPopular !== false)
            .slice(0, 6)
            .map((category) => (
              <Link
                key={category.id}
                to={`/technicians?categoryId=${category.id}`}
                className="card card-hover group flex items-start gap-4 p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                  {category.icon || '🔧'}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-800">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {category.description || 'Trusted repair and maintenance specialists.'}
                  </p>
                </div>
                <Icon
                  name="chevron-right"
                  className="ml-auto mt-1 h-5 w-5 shrink-0 text-slate-300 group-hover:text-brand-600"
                />
              </Link>
            ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Simple by design</p>
            <h2 className="section-title mt-2">How FixitNow works</h2>
            <p className="mt-3 text-sm text-slate-500">
              From report to repair in four simple steps, with a real person on the other end the
              whole way through.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-extrabold text-slate-100">0{index + 1}</span>
                </div>
                <h3 className="font-bold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured technicians */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Meet the pros</p>
            <h2 className="section-title mt-2">Featured technicians</h2>
            <p className="mt-2 text-sm text-slate-500">
              Top-rated professionals whose documents and skills have been checked by our team.
            </p>
          </div>
          <Link to="/technicians" className="btn-secondary">
            View directory
            <Icon name="arrow-right" className="h-4 w-4" />
          </Link>
        </div>
        {featuredLoading ? (
          <SkeletonCards count={3} className="h-52" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(featured?.items || []).slice(0, 3).map((tech) => (
              <Link
                key={tech.id}
                to={`/technicians/${tech.userId}`}
                className="card card-hover group p-5"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={tech.name} src={tech.user?.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-800">
                        {tech.name}
                      </h3>
                      <VerifiedBadge />
                    </div>
                    <div className="mt-1">
                      <Stars value={tech.avgRating} count={tech.reviewCount} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {tech.experienceYears} yrs experience ·{' '}
                      {tech.hourlyRate ? `${formatCurrency(tech.hourlyRate)}/hr` : 'Quote on visit'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(tech.skills || []).slice(0, 3).map((skill) => (
                    <span key={skill.id} className="badge-slate">{skill.name}</span>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon name="map-pin" className="h-4 w-4 text-slate-400" />
                  {(tech.areas || []).map((area) => area.city).join(', ') || 'Service area on request'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Technician CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              For technicians
            </p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Build a trusted repair business with FixitNow.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Get matched with real jobs, manage your weekly availability, and let your verified
              reviews win the next customer.
            </p>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-3 lg:mt-0">
            <Link to="/register" className="btn-primary bg-amber-400 text-slate-950 hover:bg-amber-300">
              Join as a technician
            </Link>
            <Link to="/login" className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Good to know</p>
            <h2 className="section-title mt-2">Frequently asked questions</h2>
          </div>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-slate-200 p-4 open:bg-slate-50">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-900">
                  {faq.q}
                  <Icon name="chevron-down" className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}