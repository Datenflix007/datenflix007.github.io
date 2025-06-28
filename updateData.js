const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const ini = require('ini');

const PROJECT_PATH = 'Datenflix007/alltagslabordata';
const BRANCH = 'main';

const IMG_FOLDER = 'img';
const AUDIO_FOLDER = 'audio';

const IMG_API_URL = `https://gitlab.com/api/v4/projects/${encodeURIComponent(PROJECT_PATH)}/repository/tree?path=${IMG_FOLDER}&ref=${BRANCH}&per_page=100`;
const AUDIO_API_URL = `https://gitlab.com/api/v4/projects/${encodeURIComponent(PROJECT_PATH)}/repository/tree?path=${AUDIO_FOLDER}&ref=${BRANCH}&per_page=100`;
const IMPRESSUM_URL = `https://gitlab.com/${PROJECT_PATH}/-/raw/${BRANCH}/impressum.txt`;
const RAW_URL_BASE = `https://gitlab.com/${PROJECT_PATH}/-/raw/${BRANCH}/`;

const EXPERIMENTS_URL = `https://gitlab.com/${PROJECT_PATH}/-/raw/${BRANCH}/_experiments.json`;

const IMG_DEST_DIR = path.join(__dirname, 'dataEditor', 'img');
const AUDIO_DEST_DIR = path.join(__dirname, 'dataEditor', 'audio');
const EXP_DEST_PATH = path.join(__dirname, 'dataEditor', '_experiments.json');
const IMPRESSUM_DEST_PATH = path.join(__dirname, 'dataEditor', 'impressum.txt');

const iniPath = path.join(__dirname, '..', '..', 'cloud.ini');
let GITLAB_TOKEN = '';

if (fs.existsSync(iniPath)) {
    const config = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
    GITLAB_TOKEN = config.token?.GITLAB_TOKEN || '';
}

async function downloadFile(filePath, dest) {
    const url = RAW_URL_BASE + filePath;
    const res = await fetch(url, {
        headers: GITLAB_TOKEN ? { 'PRIVATE-TOKEN': GITLAB_TOKEN } : {}
    });
    if (!res.ok) throw new Error(`Fehler beim Laden von ${url}: ${res.statusText}`);
    const buffer = await res.buffer();
    fs.writeFileSync(dest, buffer);
    console.log(`Heruntergeladen: ${filePath}`);
}

async function downloadExperiments() {
    const destDir = path.dirname(EXP_DEST_PATH);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const res = await fetch(EXPERIMENTS_URL);
    if (!res.ok) throw new Error(`Fehler beim Laden von experiments.json: ${res.statusText}`);
    const data = await res.buffer();
    fs.writeFileSync(EXP_DEST_PATH, data);
    console.log('Experiments.json erfolgreich heruntergeladen.');
}

async function downloadAllImages() {
    if (!fs.existsSync(IMG_DEST_DIR)) fs.mkdirSync(IMG_DEST_DIR, { recursive: true });

    const res = await fetch(IMG_API_URL, {
        headers: GITLAB_TOKEN ? { 'PRIVATE-TOKEN': GITLAB_TOKEN } : {}
    });
    if (!res.ok) throw new Error(`Fehler beim Holen der Bild-Dateiliste: ${res.statusText}`);
    const files = await res.json();

    for (const file of files) {
        if (file.type === 'blob') {
            const filePath = file.path;
            const dest = path.join(IMG_DEST_DIR, path.basename(filePath));
            await downloadFile(filePath, dest);
        }
    }

    console.log('Alle Bilder erfolgreich heruntergeladen.');
}

async function downloadAllAudio() {
    if (!fs.existsSync(AUDIO_DEST_DIR)) fs.mkdirSync(AUDIO_DEST_DIR, { recursive: true });

    const res = await fetch(AUDIO_API_URL, {
        headers: GITLAB_TOKEN ? { 'PRIVATE-TOKEN': GITLAB_TOKEN } : {}
    });
    if (!res.ok) throw new Error(`Fehler beim Holen der Audio-Dateiliste: ${res.statusText}`);
    const files = await res.json();

    for (const file of files) {
        if (file.type === 'blob') {
            const filePath = file.path;
            const dest = path.join(AUDIO_DEST_DIR, path.basename(filePath));
            await downloadFile(filePath, dest);
        }
    }

    console.log('Alle Audiodateien erfolgreich heruntergeladen.');
}



// Hauptablauf
(async () => {
    try {
        await downloadExperiments();
        await downloadAllImages();
        await downloadAllAudio();
        await downloadFile('impressum.txt', IMPRESSUM_DEST_PATH);

        console.log('========================================');
        console.log('Alle Dateien erfolgreich heruntergeladen.');
    } catch (err) {
        console.error('Fehler beim automatischen Download:', err.message);
    } finally {
        process.exit(0);
    }
})();
