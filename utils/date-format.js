function getDateFormat(format, timestamp) {
    const date = new Date(timestamp);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Miesiące są numerowane od 0 do 11
    const year = date.getFullYear().toString();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    format = format.replace('dd', day);
    format = format.replace('MM', month);
    format = format.replace('yyyy', year);
    format = format.replace('HH', hours);
    format = format.replace('mm', minutes);
    format = format.replace('ss', seconds);

    return format;
}

module.exports = getDateFormat;
