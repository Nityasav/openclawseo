import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SandboxControlPanel } from "./control-panel";

export default async function SandboxControlPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Only admins can access sandbox control
  if (profile?.role !== "admin") {
    redirect("/dashboard/overview");
  }

  const { data: sandboxes } = await supabase
    .from("sandbox_environments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Sandbox Control Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Manage demo sandbox environments</p>
      </div>
      <SandboxControlPanel sandboxes={sandboxes ?? []} />
    </div>
  );
}
