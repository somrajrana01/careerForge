import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Aptitude endpoint not implemented yet." }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ success: false, message: "Aptitude endpoint not implemented yet." }, { status: 404 });
}
