module.exports = {
    is_hello: cmd => ['witaj', 'hej', 'siema', 'cześć'].includes(cmd),
    hello: async () => 'Siema! Wpisz [help], żeby zobaczyć komendy.',
};
