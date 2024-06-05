function getCommandsFromMessage(messageStr) {
    const regex = /^\[[a-z0-9:_\|\s]+\]/gmi;
    const match = regex.exec(messageStr);
    console.log(messageStr, regex, match);
    if (match === null) {
        return [[], messageStr];
    }
    const commands = match[0]
        .replaceAll('[', '')
        .replaceAll(']', '')
        .split('|')
        .reverse();

    const contentWithoutCommands = messageStr.replaceAll(match[0], '').trim();

    return [commands, contentWithoutCommands];
}
console.log(
    getCommandsFromMessage('[every:poniedzialek 22:00]')
)
