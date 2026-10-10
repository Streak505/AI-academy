import { connectToDatabase, describeMongoError } from "@/lib/db";
import { requireAdminResponse } from "@/lib/admin-auth";

export async function GET() {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();

    return Response.json({
      success: true,
      message: "MongoDB connected successfully",
    });
  } catch (error) {
    const { code, message } = describeMongoError(error);
    console.error(`[Admin database test ${code}] ${message}`);

    return Response.json(
      {
        success: false,
        message: "MongoDB connection failed",
      },
      { status: 500 }
    );
  }
}