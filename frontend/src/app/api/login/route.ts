export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || !/^\d{10,}$/.test(phone)) {
      return new Response(JSON.stringify({ message: "Invalid phone number" }), { status: 400 });
    }

    // Simulate OTP send
    console.log("Sending OTP to:", phone);

    return new Response(JSON.stringify({ message: "OTP sent successfully" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500 });
  }
}
