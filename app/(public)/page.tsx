import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";

export default function Landing() {
  return (
    <>
      {/* First section: Hero only - not modified */}
      <div className="min-h-screen relative">
        <section
          data-hero
          className="grid w-full absolute inset-0 min-h-screen md:grid-cols-2 grid-cols-1"
        >
          <div
            className="w-full min-h-[45vh] md:min-h-screen bg-[#bae6fd] bg-cover bg-center"
            style={{
              backgroundImage: "url(/assets/home.png)",
              backgroundPosition: "center 18%",
            }}
          />
          <div className="flex flex-col justify-center bg-[#5A2D8F] min-h-[55vh] md:min-h-screen px-6 py-10 sm:px-8 sm:py-12 md:px-12 md:py-16 pt-24 sm:pt-28 md:pt-32">
            <h1
              className="max-w-full md:max-w-lg font-bold text-white text-left"
              style={{
                fontSize: "clamp(1.5rem, 3.5vw + 0.5rem, 2.75rem)",
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
              className="mt-6 md:mt-8 max-w-full md:max-w-md text-left text-white text-base sm:text-lg"
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
        className="grid grid-cols-1 md:grid-cols-2 min-h-[50vh] md:min-h-[60vh] w-full"
        style={{ backgroundColor: "#E0D5ED" }}
      >
        <div
          className="w-full min-h-[40vh] md:min-h-full bg-[#E0D5ED] bg-cover bg-center"
          style={{
            backgroundImage: "url(/assets/section.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="flex flex-col justify-center px-6 py-12 sm:px-8 md:px-12 lg:px-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight"
            style={{
              color: "#4A4A4A",
              fontSize: "clamp(1.5rem, 4vw + 0.5rem, 2.75rem)",
            }}
          >
            Talent Is Everywhere.{" "}
            <span style={{ color: "#E84989" }}>Opportunity Is Not.</span>
          </h2>
        </div>
      </section>

      {/* 7. FAQ section */}
      <section
        id="faq"
        className="py-16 sm:py-20 md:py-24 px-6 sm:px-8 md:px-12 lg:px-16 bg-white"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 md:mb-12"
            style={{ color: "#4A4A4A" }}
          >
            Frequently Asked Questions
          </h2>
          <dl className="space-y-6">
            <div>
              <dt className="text-base sm:text-lg font-semibold mb-2" style={{ color: "#4A4A4A" }}>
                What is InvestMind?
              </dt>
              <dd className="text-sm sm:text-base leading-relaxed" style={{ color: "#6B7280" }}>
                InvestMind connects youth innovators across Africa with investors, mentors, and a supportive community so great ideas get the funding, guidance, and exposure they need to grow.
              </dd>
            </div>
            <div>
              <dt className="text-base sm:text-lg font-semibold mb-2" style={{ color: "#4A4A4A" }}>
                Who can join?
              </dt>
              <dd className="text-sm sm:text-base leading-relaxed" style={{ color: "#6B7280" }}>
                Innovators with an idea or early-stage venture, and investors or mentors who want to support talent in Africa can sign up and get started.
              </dd>
            </div>
            <div>
              <dt className="text-base sm:text-lg font-semibold mb-2" style={{ color: "#4A4A4A" }}>
                How do I get started?
              </dt>
              <dd className="text-sm sm:text-base leading-relaxed" style={{ color: "#6B7280" }}>
                Click Get Started, create your account, and complete your profile. You can then explore opportunities, apply for funding, or connect with mentors.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Explore our library - card section */}
      <section
        id="library"
        className="py-14 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-white"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10"
            style={{ color: "#4A4A4A" }}
          >
            Explore our library
          </h2>

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
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

          {/* Horizontal card row - always one row, scroll on small screens */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
            <div className="flex gap-4 sm:gap-5 min-w-max justify-start">
              {[
                {
                  badge: "New",
                  title: "Pitch Ready",
                  description: "Get your idea investor-ready with guided templates and tips.",
                  bg: "linear-gradient(135deg, #E84989 0%, #f97316 100%)",
                  textColor: "#fff",
                },
                {
                  badge: null,
                  title: "Mentor Match",
                  description: "Connect with experienced mentors who believe in your vision.",
                  bg: "#5A2D8F",
                  textColor: "#fff",
                },
                {
                  badge: "New",
                  title: "Funding 101",
                  description: "Understand grants, angels, and early-stage funding options.",
                  bg: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
                  textColor: "#1f2937",
                },
                {
                  badge: "Trending",
                  title: "Startup Stories",
                  description: "Real stories from African founders who raised and scaled.",
                  bg: "linear-gradient(135deg, #bae6fd 0%, #5A2D8F 100%)",
                  textColor: "#fff",
                },
                {
                  badge: "New",
                  title: "Legal Basics",
                  description: "Company structure, IP, and contracts made simple.",
                  bg: "#22c55e",
                  textColor: "#fff",
                },
              ].map((card) => (
                <a
                  key={card.title}
                  href="/explore"
                  className="group shrink-0 w-[280px] sm:w-[300px] rounded-2xl overflow-hidden transition transform hover:scale-[1.02] hover:shadow-xl"
                  style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                >
                  <div
                    className="relative p-6 min-h-[180px] flex flex-col justify-end"
                    style={{
                      background: card.bg,
                      color: card.textColor,
                    }}
                  >
                    {card.badge && (
                      <span
                        className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "inherit" }}
                      >
                        {card.badge}
                      </span>
                    )}
                    <h3 className="text-lg font-bold mb-1">{card.title}</h3>
                    <p className="text-sm opacity-90">{card.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <a
              href="/explore"
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#4A4A4A" }}
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section
        className="py-16 sm:py-20 md:py-24 px-6 sm:px-8 md:px-12 text-center"
        style={{ backgroundColor: "#5A2D8F" }}
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Turn Your Idea Into Reality?
          </h2>
          <p className="text-white/90 text-base sm:text-lg mb-8">
            Join InvestMind and connect with investors, mentors, and a community that believes in you.
          </p>
          <a
            href="/signup"
            className="inline-block rounded-lg px-8 py-4 text-base font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#E84989" }}
          >
            Get Started
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
