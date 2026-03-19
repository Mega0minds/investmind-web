import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { ExploreIdeasContent } from "@/components/explore/ExploreIdeasContent";

export default function PublicExplorePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col min-w-0">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 min-w-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore ideas</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Discover innovations from founders across Africa. Sign up to connect and invest.
          </p>
        </div>
        <ExploreIdeasContent />
      </main>
      <Footer />
    </div>
  );
}
