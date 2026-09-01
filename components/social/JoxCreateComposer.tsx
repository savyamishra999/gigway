import CreatePostComposer from "@/components/social/CreatePostComposer";

type Author = { id?: string; name: string; avatar?: string | null };
export default function JoxCreateComposer({ profile, organizations }: { profile: Author; organizations: Author[] }) {
  return <CreatePostComposer mode="jox" profile={profile} organizations={organizations} />;
}
