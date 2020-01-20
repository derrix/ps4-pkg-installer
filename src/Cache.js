const nconf = require('nconf');
const fs = require('fs')


module.exports = class Cache {
  constructor() {
    
    const filePath = __dirname + '/../data/cache.json';
    try {
      if (!fs.existsSync(filePath)) {
        console.log("Creating cache file")
        fs.writeFileSync(filePath, '{}', { mode: 0o755 });
      }
    } catch (err) {
      console.error(err)
    }
    nconf.use('file', { file: filePath });
    nconf.load();    
    this.metaData = [];
  }

  getAll() {
    return nconf.load();
  }

  set(key, value) {
    nconf.set(key, value);
    nconf.save();
  }

  getPkgFolderPath() {
    return nconf.get("pkgFolderPath");
  }

  setPkgFolderPath(value) {
    nconf.set("pkgFolderPath", value);
    nconf.save();
  }

  getPs4IpAddress() {
    return nconf.get("ps4IpAddress");
  }

  getRepositoryAddress() {
    return nconf.get("serverIpAddress");
  }

  getPkgMetaData(fileId) {

    if (this.metaData.length == 0) {
      return null;
    }
    let data = this.metaData.filter(x => x.fileId === fileId);
    if (data === null && data.length == 0) {
      return null;
    }

    if (data.length == 0) {
      return null;
    }
    return data[0].metaData;
  }

  setPkgMetaData(fileId, data) {
    this.metaData.push({ fileId: fileId, metaData: data });
  }

}
