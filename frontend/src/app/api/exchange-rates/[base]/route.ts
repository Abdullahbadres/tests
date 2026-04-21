import { NextResponse } from "next/server";

const UPSTREAM = "https://latest.currency-api.pages.dev/v1/currencies";

export async function GET(
  _request: Request,
  context: { params: Promise<{ base: string }> },
) {
  const { base: raw } = await context.params;
  const base = encodeURIComponent(raw.trim().toLowerCase());
  const res = await fetch(`${UPSTREAM}/${base}.json`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to load exchange rates" },
      { status: res.status === 404 ? 404 : 502 },
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
