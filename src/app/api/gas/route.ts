import { NextRequest } from "next/server";

const DEFAULT_GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbyHhSy4j0a3W0doKZ5JB_579IqkC5Cqjux7nuemnlbWUnTnVCKWGqlpcLXCYhrB6DuXcQ/exec";

function resolveGasUrl(customUrl?: string | null): string {
  if (customUrl && typeof customUrl === "string" && customUrl.trim().startsWith("https://script.google.com")) {
    return customUrl.trim();
  }
  return process.env.NEXT_PUBLIC_GAS_API_URL || DEFAULT_GAS_API_URL;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customUrl = searchParams.get("gasUrl");
    const targetGasUrl = resolveGasUrl(customUrl);

    // Build the query string to forward to Google Apps Script
    const forwardedParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== "gasUrl") {
        forwardedParams.set(key, value);
      }
    });

    const queryString = forwardedParams.toString();
    const finalUrl = queryString
      ? (targetGasUrl.includes("?") ? `${targetGasUrl}&${queryString}` : `${targetGasUrl}?${queryString}`)
      : targetGasUrl;

    const res = await fetch(finalUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return Response.json(
        { status: "error", message: `Google Apps Script returned HTTP ${res.status}: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { status: "error", message: `Proxy Server Error: ${errMsg}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customUrl = body.customUrl;
    const targetGasUrl = resolveGasUrl(customUrl);

    // Remove customUrl helper field before sending to GAS if present
    const payload = { ...body };
    delete payload.customUrl;

    const res = await fetch(targetGasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      return Response.json(
        { status: "error", message: `Google Apps Script returned HTTP ${res.status}: ${res.statusText}` },
        { status: res.status }
      );
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return Response.json(data);
    } catch {
      return Response.json(
        {
          status: "error",
          message: "Google Apps Script returned invalid JSON (possibly HTML error or permission issue).",
          raw: text.slice(0, 500),
        },
        { status: 502 }
      );
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { status: "error", message: `Proxy Server Error: ${errMsg}` },
      { status: 500 }
    );
  }
}
