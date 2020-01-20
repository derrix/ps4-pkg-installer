var pkgInstallerApp = angular.module("pkgInstallerApp", []);
var socket = io();



socket.on('setting', function (setting) {
  let scope = angular.element(document.getElementById("mainController")).scope();
  for (const [key, value] of Object.entries(setting)) {
    scope[key] = value;
  }
  scope.$apply(() => { });

});

socket.on('files', function (files) {
  let scope = angular.element(document.getElementById("mainController")).scope();
  scope.updateFiles(files);
  scope.$apply(() => { });
});



socket.on('notify', function (data) {
  let scope = angular.element(document.getElementById("modalController")).scope();
  scope.text = data.text;
  scope.title = data.title;
  scope.$apply(() => { });
  $('#modalController').modal("show");
});

pkgInstallerApp.controller("mainController", function ($scope) {
  $scope.files = [];


  $scope.humanTime = function (milliseconds) {

    function numberEnding(number) {
      return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
      return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
      return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
      return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
      return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
      return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second'; //'just now' //or other string you like;
  }


  $scope.humanFileSize = function (bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
      return bytes + ' B';
    }
    var units = si
      ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  }



  $scope.download = function (file) {
    window.open(file.downloadUrl);

  }

  $scope.uploadFile = function (file) {
    socket.emit("upload", file);
  }

  $scope.uninstallFile = function (file) {
    socket.emit("uninstall", file);
  }


  $scope.updateFiles = function (files) {
    let isUploading = false;
    let ps4IpAddress = angular.element(document.querySelector('#ps4IpAddress'))
    let serverIpAddress = angular.element(document.querySelector('#serverIpAddress'))
    let pkgFolderPath = angular.element(document.querySelector('#pkgFolderPath'))


    $scope.files = [];
    files.forEach(file => {
      if (file.status !== null) {
        isUploading = true;
      }

      $scope.files.push(file);
    });

    if (isUploading) {
      ps4IpAddress.attr('disabled', 'disabled');
      serverIpAddress.attr('disabled', 'disabled');
      pkgFolderPath.attr('disabled', 'disabled');
    }
    else {
      ps4IpAddress.removeAttr('disabled');
      serverIpAddress.removeAttr('disabled');
      pkgFolderPath.removeAttr('disabled');
    }


  };

  $scope.updateValue = function (key, value) {
    socket.emit("updateSetting", { key: key, value: value });
  }
});


pkgInstallerApp.controller("modalController", function ($scope) {
  $scope.title = "";
  $scope.text = "";
});
