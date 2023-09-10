const sendMsg = require('../../utils/send-msg');
const {WolframClient} = require('node-wolfram-alpha');
const getConfig = require('../../utils/config');
const downloadFile = require('../../utils/download-file');
const deleteFolderRecursive = require('../../utils/rm-fr');
const fs = require('fs');
const api_key = getConfig('config').wolfram_api_key;
const client = new WolframClient(api_key);
const joinImages = require('join-images').default;
const {enlargeImagesInDirectory, combineImagesAndText} = require('./image-modifiers');

module.exports = {
    is_wolfram: (cmd) => cmd === 'licz',

    run_wolfram: async (cmd, messageContent, api, message) => {
        if (!api_key) {
            sendMsg(api, message.threadID,
                'Funkcja niedostępna, brak klucza API dla Wolfram Alpha');
        } else {
            wolfram(messageContent, api, message.threadID);
        }
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    },
};

function wolfram(query, api, threadID) {
    client.query(query, {format: 'image'}).then(result => {

        const pods = getPods(result);
        const finalImages = [];
        savePodsAsImages(pods, async (podTitle, savedImages, directoryToSave, podIndex) => {

            await enlargeImagesInDirectory(directoryToSave + '/' + podIndex);

            combineImagesAndText(
                podTitle,
                savedImages,
                directoryToSave + '/' + podIndex + '.png',
                () => {
                    finalImages.push(directoryToSave + '/' + podIndex + '.png');
                    deleteFolderRecursive(directoryToSave + '/' + podIndex);

                    if (finalImages.length === pods.length) {
                        const sorted = finalImages.sort((a, b) => {
                            const nameA = a.substring(a.lastIndexOf('/') + 1).split('.')[0];
                            const nameB = b.substring(b.lastIndexOf('/') + 1).split('.')[0];
                            return (+nameA) - (+nameB);
                        });

                        // sendSeparatedMessages(sorted, 0, api, threadID);
                        joinImages(sorted, {
                            margin: 10,
                            color: '#fff',
                            offset: 5,
                        }).then(img => {
                            img.toFile(directoryToSave + '/out.png').then(_ => {
                                // savedImages.forEach(path => fs.rmSync(path));
                                sendMsg(api, threadID, {
                                    attachment: fs.createReadStream(directoryToSave + '/out.png'),
                                }, () => {
                                    deleteFolderRecursive(directoryToSave);
                                });
                            });
                        });
                    }
                },
            );
        });
    });
};

function sendSeparatedMessages(images, index, api, threadID, callback) {
    sendMsg(api, threadID, {
        attachment: fs.createReadStream(images[index]),
    }, (err, msgInfo) => {
        if (index < images.length - 1) {
            sendSeparatedMessages(images, (index + 1), api, threadID);
        } else {
            callback();
        }
    });
}

function getPods(result) {
    return result.data.queryresult.pods.map(pod => {
        return {
            title: pod.title,
            subPods: pod.subpods,
        };
    });
}

function savePodsAsImages(pods, callback) {
    const folderName = (new Date()).getTime();
    const directoryToSave = __basedir + '/files/' + folderName;

    pods.forEach((pod, podIndex) => {
        const dir = directoryToSave + '/' + podIndex;

        const savedImages = [];

        pod.subPods.forEach((subPod, subPodIdx) => {
            const img = subPod.img;
            const filePath = dir + '/' + subPodIdx + '.' + img.contenttype.split('/')[1];

            downloadFile(img.src, filePath, (error) => {
                if (error) {
                    console.log(error);
                }
                savedImages.push(filePath);
                if (savedImages.length === pod.subPods.length) {
                    callback(pod.title, savedImages, directoryToSave, podIndex);
                }
            });
        });
    });
}
