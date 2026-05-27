const fs = require('fs');
const path = require('path');
const https = require('https');

const MODEL_URL = process.env.U2NET_MODEL_URL
  || 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx';

const modelDir = process.env.U2NET_HOME
  ? path.resolve(process.env.U2NET_HOME)
  : path.join(__dirname, '.u2net');

const modelPath = path.join(modelDir, 'u2net.onnx');
const tempPath = `${modelPath}.download`;

const downloadFile = (url, redirectCount = 0) => new Promise((resolve, reject) => {
  if (redirectCount > 5) {
    reject(new Error('Too many redirects while downloading U-2-Net model'));
    return;
  }

  const request = https.get(url, (response) => {
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      response.resume();
      downloadFile(response.headers.location, redirectCount + 1).then(resolve).catch(reject);
      return;
    }

    if (response.statusCode !== 200) {
      response.resume();
      reject(new Error(`U-2-Net model download failed with status ${response.statusCode}`));
      return;
    }

    fs.mkdirSync(modelDir, { recursive: true });
    const file = fs.createWriteStream(tempPath);

    response.pipe(file);

    file.on('finish', () => {
      file.close(() => {
        fs.renameSync(tempPath, modelPath);
        resolve();
      });
    });

    file.on('error', (error) => {
      file.close(() => {
        fs.rmSync(tempPath, { force: true });
        reject(error);
      });
    });
  });

  request.setTimeout(Number(process.env.U2NET_DOWNLOAD_TIMEOUT_MS || 300000), () => {
    request.destroy(new Error('U-2-Net model download timed out'));
  });

  request.on('error', (error) => {
    fs.rmSync(tempPath, { force: true });
    reject(error);
  });
});

const downloadModel = async () => {
  if (fs.existsSync(modelPath)) {
    console.log(`U-2-Net model already exists at ${modelPath}`);
    return modelPath;
  }

  console.log(`Downloading U-2-Net model to ${modelPath}`);
  await downloadFile(MODEL_URL);
  console.log('U-2-Net model downloaded');
  return modelPath;
};

module.exports = downloadModel;
