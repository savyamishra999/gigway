"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProjectForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const budget = parseFloat(formData.get("budget") as string);
    const category = formData.get("category") as string;
    const skills = (formData.get("skills") as string).split(",").map(s => s.trim());

    const { error } = await supabase.from("projects").insert({
      client_id: userId,
      title,
      description,
      budget,
      category,
      skills_required: skills,
    });

    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      router.push("/projects");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
      {/* Input fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Posting..." : "Post Project"}
      </button>
    </form>
  );
}