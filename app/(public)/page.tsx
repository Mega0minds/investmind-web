import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";

export default function Landing() {
  return (
    <div className="min-w-0 overflow-x-hidden">
      {/* First section: Hero */}
      <div className="min-h-screen relative">
        <section
          data-hero
          className="grid w-full absolute inset-0 min-h-screen md:grid-cols-2 grid-cols-1"
        >
          <div
            className="w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-screen bg-[#bae6fd] bg-cover bg-center order-2 md:order-1"
            style={{
              backgroundImage: "url(/assets/home.png)",
              backgroundPosition: "center 18%",
            }}
          />
          <div className="flex flex-col justify-center bg-[#5A2D8F] min-h-[60vh] sm:min-h-[55vh] md:min-h-screen px-4 py-8 sm:px-6 sm:py-10 md:px-12 md:py-16 pt-20 sm:pt-24 md:pt-32 order-1 md:order-2">
            <h1
              className="max-w-full md:max-w-lg font-bold text-white text-left break-words"
              style={{
                fontSize: "clamp(1.35rem, 3.5vw + 0.5rem, 2.75rem)",
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
              }}
            >
              <span className="block">Your Idea Deserves to Be{" "}
                <span style={{ color: "#E84989" }}>Seen.</span>
              </span>
              <span className="block mt-1" style={{ color: "#E84989" }}>Funded. Guided. Grown.</span>
            </h1>
            <p
              className="mt-4 sm:mt-6 md:mt-8 max-w-full md:max-w-md text-left text-white text-sm sm:text-base md:text-lg"
              style={{ lineHeight: 1.75 }}
            >
              Across Africa, brilliant ideas struggle without exposure or
              mentorship. InvestMind bridges that gap by connecting youth
              innovators with investors, mentors, and a supportive community.
            </p>
          </div>
        </section>
        <div className="relative z-10">
          <Header />
        </div>
      </div>

      {/* Second section - image left, headline right */}
      <section
        id="about"
        className="grid grid-cols-1 md:grid-cols-2 min-h-[45vh] sm:min-h-[50vh] md:min-h-[60vh] w-full"
        style={{ backgroundColor: "#E0D5ED" }}
      >
        <div
          className="w-full min-h-[35vh] sm:min-h-[40vh] md:min-h-full bg-[#E0D5ED] bg-cover bg-center order-2 md:order-1"
          style={{
            backgroundImage: "url(/assets/section.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="flex flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 md:px-12 lg:px-16 order-1 md:order-2">
          <h2
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight break-words"
            style={{
              color: "#4A4A4A",
              fontSize: "clamp(1.35rem, 4vw + 0.5rem, 2.75rem)",
            }}
          >
            Talent Is Everywhere.{" "}
            <span style={{ color: "#E84989" }}>Opportunity Is Not.</span>
          </h2>
        </div>
      </section>

      {/* Discover Africa's Next Big Ideas - user-uploaded work before login */}
      <section
        id="library"
        className="py-10 sm:py-14 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 bg-white"
      >
        <div className="mx-auto max-w-6xl w-full min-w-0">
          <h2
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4 px-2 break-words"
            style={{ color: "#4A4A4A" }}
          >
            Discover Africa&apos;s Next Big Ideas
          </h2>
          <p className="text-center text-gray-600 text-xs sm:text-sm md:text-base mb-6 sm:mb-8 max-w-xl mx-auto px-2">
            Explore innovative ideas shaping Africa&apos;s future.
          </p>

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <button
              type="button"
              className="rounded-full px-4 py-2.5 text-sm font-medium text-white transition"
              style={{ backgroundColor: "#4A4A4A" }}
            >
              ★ Featured
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2.5 text-sm font-medium transition bg-gray-100 hover:bg-gray-200"
              style={{ color: "#4A4A4A" }}
            >
              Popular
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2.5 text-sm font-medium transition bg-gray-100 hover:bg-gray-200"
              style={{ color: "#4A4A4A" }}
            >
              Startups
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2.5 text-sm font-medium transition bg-gray-100 hover:bg-gray-200"
              style={{ color: "#4A4A4A" }}
            >
              Mentorship
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2.5 text-sm font-medium transition bg-gray-100 hover:bg-gray-200"
              style={{ color: "#4A4A4A" }}
            >
              Funding
            </button>
          </div>

          {/* Auto-scrolling circus-style card row (no scrollbar, infinite loop) */}
          <div className="card-row-wrap overflow-hidden -mx-4 sm:-mx-6 md:mx-0 py-2">
            <div className="card-track flex gap-4 sm:gap-6 min-w-max w-max">
              {[
                { name: "Solar Hub", role: "Clean energy for off-grid communities", bg: "#22c55e", tilt: -1.5 },
                { name: "FarmLink", role: "Connecting smallholder farmers to markets", bg: "#f97316", tilt: 1 },
                { name: "EduTrack", role: "Learning management for schools", bg: "#84cc16", tilt: -1 },
                { name: "HealthBridge", role: "Telehealth for rural clinics", bg: "#16a34a", tilt: 1.5 },
                { name: "PayNaija", role: "Mobile payments for informal traders", bg: "#334155", tilt: -1 },
              ].flatMap((card) => [card, { ...card, name: `${card.name}-dup` }]).map((card) => (
                <a
                  key={card.name}
                  href="/explore"
                  className="group shrink-0 w-[240px] sm:w-[260px] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:z-10 touch-manipulation"
                  style={{
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
                    transform: `rotate(${card.tilt}deg)`,
                  }}
                >
                  <div
                    className="relative w-full rounded-2xl flex flex-col min-h-[280px] sm:min-h-[320px]"
                    style={{ backgroundColor: card.bg }}
                  >
                    <div className="flex-1 min-h-[140px] sm:min-h-[180px] flex items-center justify-center">
                      <span className="text-5xl sm:text-6xl text-white/90" aria-hidden>💡</span>
                    </div>
                    <div className="p-4 pt-2 pb-5">
                      <h3 className="text-base font-bold text-white mb-0.5">{card.name.replace("-dup", "")}</h3>
                      <p className="text-sm text-white/90">{card.role}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="text-center mt-6 sm:mt-8 px-2">
            <a
              href="/explore"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-white transition hover:opacity-90 min-h-[44px] touch-manipulation"
              style={{ backgroundColor: "#4A4A4A" }}
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* 7. FAQ section */}
      <section
        id="faq"
        className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-12 lg:px-16 bg-white"
      >
        <div className="mx-auto max-w-3xl w-full min-w-0">
          <h2
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12"
            style={{ color: "#4A4A4A" }}
          >
            Frequently Asked Questions
          </h2>
          <dl className="space-y-5 sm:space-y-6">
            <div>
              <dt className="text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2" style={{ color: "#4A4A4A" }}>
                What is InvestMind?
              </dt>
              <dd className="text-xs sm:text-sm md:text-base leading-relaxed" style={{ color: "#6B7280" }}>
                InvestMind connects youth innovators across Africa with investors, mentors, and a supportive community so great ideas get the funding, guidance, and exposure they need to grow.
              </dd>
            </div>
            <div>
              <dt className="text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2" style={{ color: "#4A4A4A" }}>
                Who can join?
              </dt>
              <dd className="text-xs sm:text-sm md:text-base leading-relaxed" style={{ color: "#6B7280" }}>
                Innovators with an idea or early-stage venture, and investors or mentors who want to support talent in Africa can sign up and get started.
              </dd>
            </div>
            <div>
              <dt className="text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2" style={{ color: "#4A4A4A" }}>
                How do I get started?
              </dt>
              <dd className="text-xs sm:text-sm md:text-base leading-relaxed" style={{ color: "#6B7280" }}>
                Click Get Started, create your account, and complete your profile. You can then explore opportunities, apply for funding, or connect with mentors.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section
        className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-12 text-center"
        style={{ backgroundColor: "#5A2D8F" }}
      >
        <div className="mx-auto max-w-2xl w-full min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-2 break-words">
            Ready to Turn Your Idea Into Reality?
          </h2>
          <p className="text-white/90 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 px-2">
            Join InvestMind and connect with investors, mentors, and a community that believes in you.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center justify-center w-full sm:w-auto rounded-lg px-6 py-3.5 sm:px-8 sm:py-4 text-base font-semibold text-white transition hover:opacity-90 min-h-[48px] touch-manipulation"
            style={{ backgroundColor: "#E84989" }}
          >
            Get Started
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
