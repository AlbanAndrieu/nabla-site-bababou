// Empty proxy handler for compatibility with Next.js 16+ minimal setup
import { NextResponse } from "next/server";

export default function proxy() {
	return NextResponse.next();
}
