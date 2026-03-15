export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cards, readingType, prompt } = req.body;

  if (!cards || !readingType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // カード情報をテキストに変換
  const cardText = cards.map((c, i) => {
    const position = readingType === 'three'
      ? ['過去', '現在', '未来'][i]
      : null;
    return position
      ? `${position}：${c.name}（${c.reversed ? '逆位置' : '正位置'}）`
      : `${c.name}（${c.reversed ? '逆位置' : '正位置'}）`;
  }).join('\n');

  // 鑑定タイプに応じたプロンプト
  const prompts = {
    one: `あなたはプロのタロット占い師です。以下のカードを引いた方への鑑定メッセージを日本語で書いてください。

引いたカード：
${cardText}

以下の構成で、温かく、詩的で、深みのある文章を書いてください：

【カードからのメッセージ】
（このカードが今あなたに伝えたいことを200字程度で）

【今のあなたへ】
（現在の状況や心情への洞察を200字程度で）

【これからの道しるべ】
（具体的なアドバイスや行動指針を200字程度で）

占い師として、相手の心に寄り添いながら、希望と気づきを与えるメッセージをお願いします。`,

    deep: `あなたはプロのタロット占い師です。以下のカードを引いた方への深掘り鑑定メッセージを日本語で書いてください。

引いたカード：
${cardText}

以下の構成で、詳しく、温かく、深みのある文章を書いてください：

【カードの象徴と背景】
（このカードの象徴的な意味と歴史的背景を300字程度で）

【カードからのメッセージ】
（このカードが今あなたに伝えたいことを300字程度で）

【今のあなたへ】
（現在の状況や心情への深い洞察を300字程度で）

【注意すべきポイント】
（気をつけるべきことや課題を200字程度で）

【これからの道しるべ】
（具体的なアドバイスと行動指針を300字程度で）

占い師として、相手の心に深く寄り添いながら、本質的な気づきを与えるメッセージをお願いします。`,

    three: `あなたはプロのタロット占い師です。以下の3枚のカードを引いた方への鑑定メッセージを日本語で書いてください。

引いたカード：
${cardText}

以下の構成で、温かく、深みのある文章を書いてください：

【過去のカードから】
（過去のカードが示す、これまでの流れや経緯を200字程度で）

【現在のカードから】
（現在のカードが示す、今この瞬間の状況や課題を200字程度で）

【未来のカードから】
（未来のカードが示す、これからの可能性や方向性を200字程度で）

【3枚の総合メッセージ】
（3枚を総合した深いメッセージと具体的なアドバイスを300字程度で）

占い師として、時間の流れの中でのあなたへの洞察をお願いします。`
  };

  const finalPrompt = prompt || prompts[readingType] || prompts.one;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [
          { role: 'user', content: finalPrompt }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.content[0].text;
    return res.status(200).json({ reading: text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}