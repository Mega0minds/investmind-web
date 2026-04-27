import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirectInvestorFromListingsArea } from "../_lib/redirectInvestorFromListings";
import { NewListingClient } from "./NewListingClient";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await redirectInvestorFromListingsArea(supabase, user.id);
  return <NewListingClient />;
}
