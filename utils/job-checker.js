const schedule = require('node-schedule');
const {getDb, setDbValue} = require('./db');
const sendMsg = require('./send-msg');

// Funkcja do odczytu pliku JSON
function readJobsFile() {
    try {
        return getDb('jobs');
    } catch (error) {
        console.error('Błąd odczytu pliku jobs.json:', error);
        return {};
    }
}

// Funkcja do zapisu pliku JSON
function writeJobsFile(data) {
    try {
        setDbValue('jobs', data);
    } catch (error) {
        console.error('Błąd zapisu pliku jobs.json:', error);
    }
}

// Funkcja do przetwarzania i uruchamiania zadań
function processJobs(api) {
    const currentTime = Date.now();
    const jobsData = readJobsFile();

    for (const timestamp in jobsData) {
        console.log(timestamp,currentTime);
        if (currentTime >= parseInt(timestamp)) {
            const jobDefinition = jobsData[timestamp];

            sendMsg(api, jobDefinition.threadID, jobDefinition.text);
            // Tutaj umieść kod, który ma być wykonany dla zadania
            console.log('Wykonano zadanie:', jobDefinition);

            // Usuń wykonane zadanie z pliku JSON
            delete jobsData[timestamp];
            writeJobsFile(jobsData);
        }
    }
}

module.exports = api => {
    const task = schedule.scheduleJob('* * * * *', () => {
        processJobs(api);
        console.log('run');
    });

    console.log('Skrypt rozpoczął pracę. Sprawdzanie co minutę.');
};
