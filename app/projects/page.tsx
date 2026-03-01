export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const category = params?.category;  // ✅ Optional chaining
  // ... rest
}