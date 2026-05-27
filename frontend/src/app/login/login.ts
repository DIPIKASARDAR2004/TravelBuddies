 export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone || !/^\d{10,}$/.test(phone)) {
    return new Response(JSON.stringify({ message: "Invalid phone number" }), { status: 400 });
  }

  // Simulate OTP send
  console.log("Sending OTP to:", phone);

  return new Response(JSON.stringify({ message: "OTP sent successfully" }), { status: 200 });
}
