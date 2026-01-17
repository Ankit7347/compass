// src/app/api/management/drop-collection/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function DELETE(req: NextRequest) {
  try {
    const { db, collection } = await req.json();

    if (!db || !collection) {
      return NextResponse.json({ error: "DB and Collection names are required" }, { status: 400 });
    }

    const client = await clientPromise;
    // Direct access via native driver
    const result = await client.db(db).collection(collection).drop();

    return NextResponse.json({ 
      success: result, 
      message: `Collection ${collection} dropped successfully` 
    });
  } catch (error: any) {
    console.error("Drop Collection Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to drop collection" 
    }, { status: 500 });
  }
}