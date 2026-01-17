// src/app/api/management/drop-database/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function DELETE(req: NextRequest) {
  try {
    const { db } = await req.json();

    if (!db) {
      return NextResponse.json({ error: "Database name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    // Access the database instance and drop it
    const result = await client.db(db).dropDatabase();

    return NextResponse.json({ 
      success: !!result, 
      message: `Database ${db} dropped successfully` 
    });
  } catch (error: any) {
    console.error("Drop Database Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to drop database" 
    }, { status: 500 });
  }
}