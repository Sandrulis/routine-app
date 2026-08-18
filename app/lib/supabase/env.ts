export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey || url.includes("YOUR_")) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}

export function isSupabaseAdminConfigured() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!isSupabaseConfigured() || !serviceKey) {
    return false;
  }
  if (/your_|placeholder|changeme|example/i.test(serviceKey)) {
    return false;
  }
  return serviceKey.startsWith("eyJ") && serviceKey.length > 100;
}
