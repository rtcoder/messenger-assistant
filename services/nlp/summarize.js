function summarize(text) {
    if (typeof text !== 'string' || text.length > 20000) throw Error('Invalid summary input');
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)?.map(s => s.trim()).filter(Boolean) || [];
    if (sentences.length <= 3) return text;
    const words = s => s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [];
    const frequencies = new Map();
    for (const word of words(text)) frequencies.set(word, (frequencies.get(word) || 0) + 1);
    return sentences.map((sentence, index) => {
        const tokens = words(sentence);
        const score = tokens.reduce((sum, word) => sum + frequencies.get(word), 0) / Math.sqrt(tokens.length || 1);
        return {sentence, index, score};
    }).sort((a, b) => b.score - a.score).slice(0, 3).sort((a, b) => a.index - b.index).map(v => v.sentence).join(' ');
}

module.exports = {is_summarize: cmd => cmd === 'summarize', summarize_text: async (cmd, text) => summarize(text)};
