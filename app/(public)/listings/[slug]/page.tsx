export default function ListingDetails({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div>
      <h1>Listing Details: {params.slug}</h1>
    </div>
  );
}
