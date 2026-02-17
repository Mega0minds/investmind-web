export default function ListingAnalytics({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div>
      <h1>Listing Analytics: {params.slug}</h1>
    </div>
  );
}
