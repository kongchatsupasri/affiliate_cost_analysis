const fetch = require('node-fetch');

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { data } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `
System: Your mission is to analyze affiliate marketing performance and provide actionable strategies to maximize the user's net profit. You are a Senior E-commerce Analyst.

Context: Sellers are struggling with rising platform fees. Your goal is to optimize affiliate costs while maintaining sales momentum.
Data (JSON):  ${JSON.stringify(data)}

Instructions: Analyze the data and provide the “ผลการวิเคราะห์ข้อมูล” in THAI using Markdown formatting. Follow this structure:

1. **Impact on Sales (สรุปผลต่อยอดขาย):** Evaluate the store's reliance on affiliates.
- Format: Markdown Table [Platform | % ยอดขายจาก Affiliate | % ออร์เดอร์จาก Affiliate | ระดับการพึ่งพา Affiliate]
- Thresholds: High (>30%), Medium (15-30%), Low (<15%). 
- *Special Logic:* If affiliate sales are near zero, mark as "Untapped Potential" (โอกาสที่ยังไม่ได้ใช้). Congratulate on low costs but warn about missed traffic and market share.

2. **Impact on Costs (สรุปผลต่อค่าใช้จ่าย):** Assess cost sustainability.
- Format: Markdown Table [Platform | % ต้นทุน Affiliate เฉลี่ยต่อยอดขาย | ระดับความเสี่ยงของต้นทุน]
- Thresholds: Low (<2%), Medium (2-5%), High (>5%).
- *Special Logic:* If cost is zero, acknowledge the 100% margin safety but suggest a growth test in the suggestion section.

3. **Data Insight & Pattern Recognition (วิเคราะห์เจาะลึก):** Report only significant findings from these areas:
- **Campaign Correlation:** Detect if costs/orders spike during Double Day (2/2, 3/3...), Mid-Month (15th), or Payday. If spikes occur, advise if the seller should lower Affiliate % to prevent "Last Click" leakage from organic traffic.
- **Platform Strategy:** Compare reliance across platforms. (e.g., If TikTok has high reliance but low sales, explain that TikTok's nature as Social Commerce often requires higher affiliate investment compared to Shopee/Lazada).
- **Product Strategy Hypothesis:** Based on total data, suggest if specific products might need more or less affiliate support based on their uniqueness or market competition.

4. **Strategic Suggestions (บทสรุปและสิ่งที่แนะนำ):**
- Provide a concise list using [STOP], [CONTINUE], or [WATCH].
- **Product-Level Audit:** Remind the user to manually audit at the 'SKU level' (since SKU data isn't here) to ensure margins are protected.
- **Low/Zero Affiliate Hack:** If usage is low, explicitly suggest: "Increase affiliate fees to 3-5% for a 14-day trial to test market response."
- **Contact Builder:** Notify user that for a more detailed analysis, they can contact the builder.

Note: OUTPUT MUST BE ENTIRELY IN THAI. Keep it short, professional, and actionable. Focus on steps the user can implement in the Seller Center TODAY. No fluff.
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const result = await response.json();
    const analysis = result.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
