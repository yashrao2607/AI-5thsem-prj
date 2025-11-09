
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { phone, message } = await request.json();

  if (!process.env.FAST2SMS_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'SMS API key is not configured.' },
      { status: 500 }
    );
  }

  if (!phone || !message) {
    return NextResponse.json(
      { success: false, message: 'Phone number and message are required.' },
      { status: 400 }
    );
  }

  const payload = {
    route: 'p', // 'p' for promotional route
    message: message,
    numbers: phone,
  };

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.return === true && data.request_id) {
       return NextResponse.json({ success: true, message: 'SMS sent successfully.' });
    } else {
        // Fast2SMS might return an error message
        return NextResponse.json({ success: false, message: data.message || 'Failed to send SMS.' }, { status: response.status });
    }
  } catch (error) {
    console.error('Fast2SMS API Error:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
