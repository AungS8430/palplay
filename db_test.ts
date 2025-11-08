import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL="https://zaicpsooysrhfeyudhdf.supabase.co"
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaWNwc29veXNyaGZleXVkaGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzkzMjMsImV4cCI6MjA3NzM1NTMyM30.9cP3d15nRwTWiRpZ-YGDtsqqQrSidQIydPxflwkCrdo"


async function testUnauthorizedAccess() {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log("Testing unauthorized access...");

  // Try to read group_members
  const { data: members, error: membersError } = await client
    .from("group_members")
    .select("*");

  console.log("group_members:", { members, membersError });

  // Try to read groups
  const { data: groups, error: groupsError } = await client
    .from("groups")
    .select("*");

  console.log("groups:", { groups, groupsError });
}

testUnauthorizedAccess();
