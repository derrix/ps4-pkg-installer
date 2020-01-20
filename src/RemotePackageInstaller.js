const request = require("request")
var replaceall = require("replaceall");
const dJSON = require('dirty-json');

module.exports = class RemotePackageInstaller {
  constructor(setting) {
    this.setting = setting;
    this.ps4Port = 12800;
  }

  sendFile(file) {
    const jsonData = {
      type: "direct",
      "packages": [file.downloadUrl]
    };
    return new Promise((resolve, reject) => {
      request.post("http://" + this.setting.getPs4IpAddress() + ":" + this.ps4Port + "/api/install", {
        json: jsonData
      }, (error, res, body) => {
        if (error) {
          reject(error);
        }
        else {
          let response = this.parseDirtyResponse(body, false);
          if (response.status == "fail") {
            reject(response);
          }
          else {
            resolve(response);
          }
        }
      })
    });
  }

  uninstallFile(file) {
    const jsonData = { "title_id": file.metaData.TITLE_ID };
    return new Promise((resolve, reject) => {
      request.post("http://" + this.setting.getPs4IpAddress() + ":" + this.ps4Port + "/api/uninstall_game", {
        json: jsonData
      }, (error, res, body) => {
        if (error) {
          reject(error);
        }
        else {
          let response = this.parseDirtyResponse(body, false);
          if (response.status == "fail") {
            reject(response);
          }
          else {
            resolve(response);
          }
        }
      })
    });
  }

  getProgress(taskId) {
    let jsonData = {
      "task_id": taskId
    };
    return new Promise((resolve, reject) => {
      request.post("http://" + this.setting.getPs4IpAddress() + ":" + this.ps4Port + "/api/get_task_progress", {
        json: jsonData
      }, (error, res, body) => {

        if (error) {
          reject(error);
        }
        else {
          resolve(this.parseDirtyResponse(body, true));
        }
      })
    });
  }

  parseDirtyResponse(response, useDirtyJSon) {
    //@todo Improve this shit!
    if (typeof response === 'object') {
      return response;
    }

    let value = response;
    try {
      value = replaceall("0x", '', value);
      value.replace(/0x/g, "");
    }
    catch (e) {
      console.error(e);
    }
    try {
      value = useDirtyJSon ? dJSON.parse(value) : JSON.parse(value);
    }
    catch (e) {
      console.log("Error parsing Json");
      console.error(e);
    }
    return value;
  }
}
