export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, password, accountType } = body;

    if (!fullName || !email || !phone || !password) {
      return new Response(JSON.stringify({ message: "All fields are required" }), { status: 400 });
    }

    // Simulate successful account creation
    console.log("Creating account for:", { fullName, email, accountType });

    return new Response(JSON.stringify({ message: "Account created successfully! Please login." }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
