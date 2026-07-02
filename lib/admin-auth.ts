import { supabase } from "@/src/lib/supabase";

export type AdminProfile = {
  email: string;
  name: string | null;
  role: string | null;
};

type AdminProfileResult =
  | {
      data: AdminProfile | null;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

type AdminUserRow = {
  email: string | null;
  name: string | null;
  role: string | null;
};

export async function fetchAdminProfileByEmail(
  email: string,
): Promise<AdminProfileResult> {
  if (!supabase) {
    return {
      data: null,
      error: "Supabase client is not configured.",
    };
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("email, name, role")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  if (!data) {
    return {
      data: null,
      error: null,
    };
  }

  const adminUser = data as AdminUserRow;

  return {
    data: {
      email: adminUser.email ?? email,
      name: adminUser.name,
      role: adminUser.role,
    },
    error: null,
  };
}
