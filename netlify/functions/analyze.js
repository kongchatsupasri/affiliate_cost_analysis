exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { data } = JSON.parse(event.body);

    if (!data || Object.keys(data).length === 0) {
      return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "ไม่มีข้อมูลสำหรับวิเคราะห์" }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "API Key ไม่ถูกตั้งค่า กรุณาตรวจสอบ Netlify Environment Variables" }) };
    }

    const prompt = `System: Analyze affiliate marketing performance. You are a Senior E-commerce Analyst.
Data: ${JSON.stringify(data)}
Provide analysis in THAI only. Structure:
1. Impact on Sales - Table: Platform | % Sales from Affiliate | % Orders from Affiliate | Risk Level
2. Impact on Costs - Table: Platform | Avg Cost % | Risk Level
3. Key Insights - Significant findings and patterns
4. Recommendations - Use [STOP], [CONTINUE], [WATCH] format
Keep it professional, actionable, no fluff.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      const errMsg = geminiRes.status === 429 ? 'ขออภัยในความไม่สะดวก ขณะนี้ระบบ AI มีการใช้งานสูง กรุณารอ 1-2 นาทีแล้วกดวิเคราะห์ใหม่อีกครั้ง' : 'เกิดข้อผิดพลาดจาก Gemini API';
      throw new Error(errMsg);
    }

    const geminiData = await geminiRes.json();
    const analysis = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) throw new Error("ไม่ได้รับผลการวิเคราะห์จาก Gemini");

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ analysis })
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "เกิดข้อผิดพลาดภายในระบบ" })
    };
  }
};
