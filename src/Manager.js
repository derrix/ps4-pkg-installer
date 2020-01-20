
var recursive = require("recursive-readdir");
const path = require('path');
const shortHash = require('short-hash');
const RemotePackageInstaller = require('./RemotePackageInstaller');
const Setting = require('./Cache');
const { base64encode } = require('nodejs-base64');
const fs = require("fs");
const pkgInfo = require("ps4-pkg-info");


module.exports = class Manager {
  constructor(http) {
    this.files = [];

    this.uploads = [];
    this.uploadsSemaphore = 0;
    this.uploadsInfo = [];
    this.updatePercentage();

    this.setting = new Setting();
    this.port = http.address().port;
    this.remotePackageInstaller = new RemotePackageInstaller(this.setting);



    this.io = require('socket.io')(http);
    this.io.on('connection', (socket) => {

      socket.emit('files', this.getFileList());
      socket.emit('setting', this.setting.getAll());
      socket.on('updateSetting', (setting) => {
        this.setting.set(setting.key, setting.value.length > 0 ? setting.value : null);
        this.io.emit('setting', this.setting.getAll());
        this.updateFiles(false);
      });

      socket.on('upload', (file) => {
        this.uploadsInfo[file.fileId] = -1;
        this.updateFiles(true);
        this.remotePackageInstaller.sendFile(file).then(data => {
          this.uploads[file.fileId] = { "file": file, "task": data };
          this.updateFiles(false);

        }).catch(error => {
          console.error("Error on socket.on.upload");
          console.error(error);
          delete this.uploadsInfo[file.fileId];
          socket.emit('notify', this.getNotifyData("Error uploading content", JSON.stringify(error, null, 2)));
        });
      });

      socket.on('uninstall', (file) => {
        this.uploadsInfo[file.fileId] = -1;
        this.updateFiles(true);
        this.remotePackageInstaller.uninstallFile(file).then(data => {
          delete this.uploadsInfo[file.fileId];
          this.updateFiles(true);
          socket.emit('notify', this.getNotifyData("Uninstall Successful", file.metaData.TITLE + " removed"));
        }).catch(error => {
          delete this.uploadsInfo[file.fileId];
          this.updateFiles(true);
          console.error("Error on socket.on.upload");
          console.error(error);
          socket.emit('notify', this.getNotifyData("Error uploading content", JSON.stringify(error, null, 2)));
        });
      });

    });

    this.updateFiles(true);
  }

  getNotifyData(title, text) {
    return {
      "title": title,
      "text": text
    }
  }

  updateFiles(loop) {
    let pkgFolderPath = this.setting.getPkgFolderPath();

    if (pkgFolderPath) {
      try {
        const stat = fs.statSync(pkgFolderPath);
        function allowFiles(file, stats) {
          return !stats.isDirectory() && !(path.extname(file) === ".pkg");
        }

        if (stat.isDirectory()) {
          recursive(pkgFolderPath, [allowFiles], (err, files) => {
            this.files = files;
            this.io.emit('files', this.getFileList());
          });
        }
        else {
          this.io.emit('files', []);
        }
      } catch (error) {
        console.error("Error on pkgFolderPath");
        console.error(error);
        this.io.emit('files', []);
        this.io.emit('notify', this.getNotifyData("Error", "Folder: " + pkgFolderPath + ", not exist!"));
        this.setting.setPkgFolderPath(null);
        this.io.emit('setting', this.setting.getAll());

      }
    }
    else {
      this.io.emit('files', []);
    }
    if (loop) {
      setTimeout(() => { this.updateFiles(true) }, 5000);
    }
  }



  updatePercentage() {
    let i = 0;
    let foundData = false;

    if (Object.entries(this.uploads).length <= this.uploadsSemaphore) {
      this.uploadsSemaphore = 0;
    }

    for (const [fileId, upload] of Object.entries(this.uploads)) {

      if (i == this.uploadsSemaphore) {
        foundData = true;
        this.remotePackageInstaller.getProgress(upload.task.task_id).then(data => {
          this.uploadsInfo[fileId] = data;
          if (data.rest_sec_total == 0) {
            this.io.emit('notify', this.getNotifyData("Info", "Installation complete:" + upload.task.title));
            delete this.uploadsInfo[fileId];
            delete this.uploads[fileId];
          }
          this.uploadsSemaphore++;
          setTimeout(() => { this.updatePercentage() }, 5000);
        }).catch(error => {
          console.error("Error on updatePercentage");
          console.error(error);
          this.uploadsSemaphore++;
        });
        break;
      }
      i++;
    }

    if (!foundData) {
      setTimeout(() => { this.updatePercentage() }, 5000);
    }
  }

  getFileList() {
    let data = [];
    this.files.forEach(file => {
      let fileId = shortHash(file);

      let metaData = this.setting.getPkgMetaData(fileId);

      if (metaData === null) {
        pkgInfo.extract(file).then(data => {
          this.setting.setPkgMetaData(fileId, data);
          this.updateFiles(false);
        }).catch(error => {
          console.error(error);
        });
      }


      let fileSize = fs.statSync(file).size;
      let status = null;

      if (typeof this.uploadsInfo[fileId] !== 'undefined') {
        status = this.uploadsInfo[fileId];
      }

      data.push({
        fileId: fileId,
        fileName: path.basename(file),
        downloadUrl: "http://" + this.setting.getRepositoryAddress() + ":" + this.port + "/download/" + base64encode(file),
        filePath: file,
        fileSize: fileSize,
        status: status,
        metaData: metaData
      });
    });

    return data;
  }
}
