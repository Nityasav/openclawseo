import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.next ?? "/dashboard/overview");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white px-6 py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-light tracking-tight text-white">SEOClaw</h1>
          <p className="mt-2 text-white/40 text-sm">Sign in to your account</p>
        </div>
        <LoginForm error={searchParams.error} next={searchParams.next} />
      </div>
    </div>
  );
}
