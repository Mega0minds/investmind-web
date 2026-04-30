import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 px-4 sm:px-6 md:px-10 py-10 sm:py-14">
        <section className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">About Us</h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600">
            InvestMind empowers young innovators with visibility, guidance, and access to the right opportunities.
          </p>

          <div className="mt-8 space-y-5">
            <div className="rounded-2xl bg-[#F5F0FA] p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[#5A2D8F]">Vision Statement</h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-700">
                To become Africa&apos;s leading opportunity platform that raises a generation of
                purpose-driven young innovators, nurtures idea-stage entrepreneurs into impactful
                ventures through excellence, influence, and visibility across Africa and beyond,
                while advancing God&apos;s kingdom.
              </p>
            </div>

            <div className="rounded-2xl bg-[#F5F0FA] p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[#5A2D8F]">Mission Statement</h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-gray-700">
                To empower young innovators by providing funding, mentorship, and strategic
                connections, support their entrepreneurial journey through the right training, safe
                financial pathways, and structured monitoring systems for sustainable business
                ventures.
              </p>
            </div>

            <div className="rounded-2xl bg-[#F5F0FA] p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-[#5A2D8F]">
                About the Founder - InvestMind
              </h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 sm:gap-6 items-start">
                <div className="relative w-full aspect-4/5 overflow-hidden rounded-2xl border border-[#CBB7E6] bg-white">
                  <Image
                    src="/assets/founder.jpg"
                    alt="Theresa Chinyere Adiele, founder of InvestMind"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 220px"
                  />
                </div>
                <div className="space-y-3 text-sm sm:text-base leading-relaxed text-gray-700">
                  <p>
                    Theresa Chinyere Adiele is a purpose-driven entrepreneur, financial literacy
                    advocate, and visionary behind InvestMind - a mobile-first platform designed to
                    empower young Africans to transform ideas, talents, and innovations into
                    sustainable ventures.
                  </p>
                  <p>
                    With a strong passion for youth development, financial inclusion, and
                    kingdom-driven impact, she is committed to solving one of Africa&apos;s biggest
                    challenges - the lack of visibility, mentorship, and structured support for
                    idea-stage innovators.
                  </p>
                  <div>
                    <p className="font-medium text-gray-800">Through her work, she has focused on:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      <li>Promoting financial discipline and investment awareness</li>
                      <li>Supporting young entrepreneurs with guidance and strategy</li>
                      <li>Building platforms that connect youth, mentors, and investors</li>
                    </ul>
                  </div>
                  <p>
                    Her vision for InvestMind is to raise a generation of purpose-driven innovators
                    who create wealth, drive impact, and influence society positively across Africa
                    and beyond.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
