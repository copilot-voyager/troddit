import type { NextApiRequest, NextApiResponse } from "next";
import { ROUTES_TYPES } from "../../../../types/logs";
import { createClient } from "@supabase/supabase-js";
const LOG_REQUESTS = JSON.parse(
  process?.env?.NEXT_PUBLIC_ENABLE_API_LOG ?? "false"
);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).end();
    return;
  }

  const body = request.body;
  const route_type = body?.route_type;
  if (
    !Object.values(ROUTES_TYPES).includes(route_type) ||
    !(typeof body?.is_oauth === "boolean")
  ) {
    response.statusMessage = "invalid body";
    response.status(400).end();
    return;
  }
  if (LOG_REQUESTS) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase Credentials");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.rpc("increment_log", {
      c_date: new Date(),
      is_oauth: body?.is_oauth ?? false,
      route_type: route_type,
    });

    if (error) {
      console.error("Err?", error);
      response.statusMessage = "Log Error";
      response.status(500).end();
      return;
    }
  }

  response.statusMessage = LOG_REQUESTS ? `logged ${route_type}` : "logging disabled";
  response.status(200).end();
};

export default handler;
