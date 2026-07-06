import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, MapPin, Users, CalendarDays } from "lucide-react";
import heroImage from "../assets/sign.jpg";

const highlights = [
  {
    icon: Sparkles,
    title: "Curated salons",
    description:
      "Only hand-picked spaces with verified service quality and style.",
  },
  {
    icon: MapPin,
    title: "Local discovery",
    description:
      "Find nearby salons fast with location-aware search and map view.",
  },
  {
    icon: CalendarDays,
    title: "Simple booking",
    description:
      "Move from browsing to booking with fewer taps and less friction.",
  },
  {
    icon: Users,
    title: "Built for regulars",
    description:
      "This platform helps guests keep their favorite salons in one place.",
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#ffffff] text-stone-800">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F4E9E5] px-4 py-2 text-sm font-medium text-[#6B554D] mb-6">
              <Heart size={14} fill="currentColor" />
              About Us
            </div>
            <h1 className="font-serif text-3xl leading-tight text-stone-900 mb-6 sm:text-4xl md:text-5xl">
              A calmer way to discover salons you actually want to book.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-stone-600 mb-8">
              This experience is designed to make salon discovery feel polished instead
              of noisy. It blends nearby search, clear location context, and
              straightforward booking so users can move faster from inspiration
              to appointment.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/")}
                className="rounded-xl bg-[#6B554D] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5C4841]"
              >
                Back to Home
              </button>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-4xl border border-stone-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:aspect-[5/4] lg:aspect-[4/5]">
            <img
              src={heroImage}
              alt="Salon interior"
              className="h-full w-full object-cover scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF9]/10 via-transparent to-[#C49B89]/20 mix-blend-screen" />
            <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
            <div className="absolute right-8 bottom-10 h-44 w-44 rounded-full bg-[#C49B89]/25 blur-3xl" />

            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="mb-2 text-xs uppercase tracking-[0.35em] text-white/70">
                of a frustrating one
              </p>
              <p className="max-w-md text-sm leading-6 text-white/90">
                Designed for quick discovery, nearby salons, and a cleaner
                booking journey.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4E9E5] text-[#6B554D]">
                  <Icon size={20} />
                </div>
                <h2 className="font-serif text-xl text-stone-900 mb-2">
                  {item.title}
                </h2>
                <p className="text-sm leading-6 text-stone-500">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
