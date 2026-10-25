const ADMIN_COMMANDS = new Set(['title', 'everyone', 'call_all', 'call_girls', 'call_boys', 'call_admin']);

function admitted(message, config) {
    if (!message || !['message', 'message_reply'].includes(message.type) || typeof message.senderID !== 'string' || typeof message.threadID !== 'string' || message.senderID === config.bot_user_id) return false;
    if (!message.isGroup && message.threadID === message.senderID) return config.allow_private_messages && config.allowed_user_ids.includes(message.senderID);
    return message.isGroup === true && config.threads_ids.includes(message.threadID) && typeof message.mentions?.[config.bot_user_id] === 'string';
}

function parseMessage(message, config) {
    if (!admitted(message, config)) return null;
    if (message.messageID !== undefined && (typeof message.messageID !== 'string' || !message.messageID || message.messageID.length > 256)) throw Error('Invalid message id');
    if (typeof message.body !== 'string' || message.body.length > config.max_input_length) throw Error('Invalid body');
    let body = message.body;
    const mention = message.mentions?.[config.bot_user_id];
    if (mention) body = body.split(mention).join('').trim();
    const prefix = config.bot_response_prefix;
    if (prefix && body.startsWith(prefix)) body = body.slice(prefix.length).trim();
    const match = /^\[([^\]\n]+)\]\s*([\s\S]*)$/.exec(body.trim());
    if (!match) return null;
    const commands = match[1].split('|').map(cmd => cmd.trim().toLowerCase()).reverse();
    if (commands.length > config.max_commands || commands.some(cmd => !cmd || !/^[\p{L}0-9:_\s]+$/u.test(cmd))) throw Error('Invalid command');
    const content = message.messageReply?.body ?? match[2];
    if (typeof content !== 'string' || content.length > config.max_input_length) throw Error('Invalid content');
    return {commands, content: content.trim()};
}

function authorizeCommands(commands, message, config) {
    const admin = config.admin_user_ids.includes(message.senderID);
    return commands.every(cmd => {
        if (ADMIN_COMMANDS.has(cmd)) return message.isGroup === true && admin;
        if (cmd === 'pobierz') return config.enable_downloads && (admin || config.download_user_ids.includes(message.senderID));
        return true;
    });
}

module.exports = {parseMessage, authorizeCommands, admitted};
