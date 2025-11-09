import { NextResponse } from "next/server";
import { executeAction, getState } from "@/lib/store";
import { ActionRequest } from "@/lib/types";

export async function GET() {
  return NextResponse.json(getState());
}

export async function POST(request: Request) {
  const body = (await request.json()) as ActionRequest;
  const result = executeAction(body);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
