export default function EditListing({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div>
      <h1>Edit Listing: {params.slug}</h1>
    </div>
  );
}
