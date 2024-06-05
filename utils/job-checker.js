const schedule = require('node-schedule');
const {getDb, setDbValue} = require('./db');
const sendMsg = require('./send-msg');

// Funkcja do odczytu pliku JSON
function readJobsFile(filename) {
    try {
        return getDb(filename);
    } catch (error) {
        console.error('Błąd odczytu pliku ' + filename + '.json:', error);
        return {};
    }
}

// Funkcja do zapisu pliku JSON
function writeJobsFile(filename, data) {
    try {
        setDbValue(filename, data);
    } catch (error) {
        console.error('Błąd zapisu pliku ' + filename + '.json:', error);
    }
}

// Funkcja do przetwarzania i uruchamiania zadań
function processJobs(api) {
    const currentTime = Date.now();
    const jobsData = readJobsFile('jobs');

    for (const timestamp in jobsData) {
        console.log(timestamp, currentTime);
        if (currentTime >= parseInt(timestamp)) {
            const jobDefinition = jobsData[timestamp];

            sendMsg(api, jobDefinition.threadID, jobDefinition.text);
            // Tutaj umieść kod, który ma być wykonany dla zadania
            console.log('Wykonano zadanie:', jobDefinition);

            // Usuń wykonane zadanie z pliku JSON
            delete jobsData[timestamp];
            writeJobsFile('jobs', jobsData);
        }
    }
}

// Obiekt do przechowywania bieżących zadań cyklicznych
const recurringTasks = {};

// Funkcja do odczytu pliku circular-jobs.json i uruchamiania zadań zdefiniowanych w nim
function processCircularJobs() {
    // Odczytaj zawartość pliku circular-jobs.json
    const jobsData = readJobsFile('circular-jobs');

    // Przeiteruj przez zadania zdefiniowane w pliku
    for (const ID in jobsData) {
        if (jobsData.hasOwnProperty(ID)) {
            const job = jobsData[ID];
            const jobDefinition = job.jobDefinition;

            // Tworzenie harmonogramu na podstawie interwału
            const interval = job.interval;

            if (!recurringTasks[interval]) {
                // Jeśli zadanie o takim interwale nie istnieje, utwórz nowe
                recurringTasks[interval] = [];

                const task = schedule.scheduleJob(interval, () => {
                    console.log(`Wykonywanie zadań o interwale ${interval}`);
                    recurringTasks[interval].forEach((job) => {
                        // Tutaj możesz umieścić kod, który ma być wykonywany na podstawie job.jobDefinition
                        console.log(`- Wykonywanie zadania: ${job.jobDefinition}`);
                    });
                });

                console.log(`Dodano zadanie o interwale ${interval}`);
            }

            // Dodaj bieżące zadanie do listy zadań o tym samym interwale
            recurringTasks[interval].push({jobDefinition});
        }
    }
}

module.exports = api => {
    const task = schedule.scheduleJob('* * * * *', () => {
        processJobs(api);
        processCircularJobs(api);
        console.log('run');
    });

    console.log('Skrypt rozpoczął pracę. Sprawdzanie co minutę.');
};
