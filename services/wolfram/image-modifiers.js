const sharp = require('sharp');
const fs = require('fs');

async function enlargeImage(inputPath, outputPath) {
    try {
        // Wczytaj obrazek za pomocą sharp
        const image = sharp(inputPath);

        // Pobierz metadane obrazka
        const metadata = await image.metadata();

        // Sprawdź wysokość obrazka
        if (metadata.height < 50) {
            // Jeśli wysokość jest mniejsza niż docelowa, to powiększ obrazek dwukrotnie
            await image.resize({height: metadata.height * 2}).toFile(outputPath);
        }
    } catch (error) {
        console.error(`Błąd przetwarzania obrazka: ${inputPath}`);
        console.error(error);
    }
}

async function enlargeImagesInDirectory(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);

        for (const file of files) {
            const inputPath = `${directoryPath}/${file}`;
            const outputPath = `${directoryPath}/_${file}`;

            await enlargeImage(inputPath, outputPath);

            if (fs.existsSync(outputPath)) {
                fs.rmSync(inputPath);
                fs.renameSync(outputPath, inputPath);
            }
        }
    } catch (error) {
        console.error('Błąd odczytu katalogu obrazków.');
        console.error(error);
    }
}

function combineImagesAndText(title, files, outputPath, callback) {
    try {
        let combinedImage = gm(400, 50, '#fff');

        for (const file of files) {
            combinedImage.append(file); // Dodaj obrazek
        }

        combinedImage.write(outputPath, (writeError) => {
            if (writeError) {
                console.error('Błąd zapisu obrazka wynikowego.');
                console.error(writeError);
            } else {
                let combinedImage = gm(outputPath);
                const spacerHeight = 20;
                // Dodaj tytuł nad obrazkiem wynikowym
                combinedImage = combinedImage.gravity('North');
                combinedImage = combinedImage.fontSize(24);
                combinedImage = combinedImage.drawText(0, spacerHeight / 2, title);
                combinedImage.write(outputPath, (writeError) => {
                    if (writeError) {
                        console.error('Błąd zapisu obrazka wynikowego.');
                        console.error(writeError);
                    } else {
                        console.log('Zapisano obrazek wynikowy: ' + outputPath);
                    }
                    cropWhiteField(outputPath, () => {
                        callback();
                    });
                });
            }
        });
    } catch (error) {
        console.error('Błąd przetwarzania obrazków i tekstu.');
        console.error(error);
    }
}

function cropWhiteField(inputImagePath, callback) {

// Margines, który pomaga określić, kiedy przyciąć
    const margin = 10;

// Otwórz obrazek
    gm(inputImagePath)
        .borderColor('white') // Ustaw kolor obramowania na biały
        .border(margin, margin) // Dodaj obramowanie o rozmiarze marginesu

        // Automatycznie przyciąć, usuwając białe tło po bokach
        .trim()

        .write(inputImagePath, (error) => {
            if (error) {
                console.error('Błąd podczas zapisywania przyciętego obrazka.');
                console.error(error);
            } else {
                callback();
                console.log('Zapisano przycięty obrazek: ' + inputImagePath);
            }
        });
}

module.exports = {
    enlargeImagesInDirectory,
    combineImagesAndText,
};
