import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { ExploreIdeasContent } from "@/components/explore/ExploreIdeasContent";
import { createClient } from "@/lib/supabase/server";
import { fetchExploreProjects, fetchTrendingProjectsByViews } from "@/lib/explore-projects";

export const revalidate = 60;

export default async function PublicExplorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const projects = await fetchExploreProjects(supabase, {
    excludeCreatorId: user?.id ?? undefined,
  });
  const trending = await fetchTrendingProjectsByViews(supabase, {
    excludeCreatorId: user?.id ?? undefined,
    limit: 3,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col min-w-0">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 min-w-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore ideas</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Discover innovations from creatives across Africa. Sign up to connect and invest.
          </p>
        </div>
        <ExploreIdeasContent projects={projects} trending={trending} />
      </main>
      <Footer />
    </div>
  );
}
