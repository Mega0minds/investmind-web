export default function ListingUpdates({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div>
      <h1>Listing Updates: {params.slug}</h1>
    </div>
  );
}
