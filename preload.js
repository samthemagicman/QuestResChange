const { exec } = require('child_process');
var $;
const adbPath = ".\\resources\\adb.exe"



window.addEventListener('DOMContentLoaded', () => {
    $ = require('jquery');
    const ipcRenderer = require('electron').ipcRenderer; 
    var currentResSetting = 0;
    var currentHzSetting = 0;

    RefreshPackageList();

    $("#refresh-packages").click(RefreshPackageList);

    $("#resolution-setting").on("click", ".btn", (btn) => {
        var curr = $("#resolution-setting > .btn-primary");
        (curr).removeClass("btn-primary");
        (curr).addClass("btn-outline-primary");
        curr = $(btn.target);
        $(btn.target).addClass("btn-primary");
        $(btn.target).removeClass("btn-outline-primary");
        currentResSetting = $(btn.target).data("resolution");
    })
    $("#refresh-rate-setting").on("click", ".btn", (btn) => {
        var curr = $("#refresh-rate-setting > .btn-primary");
        (curr).removeClass("btn-primary");
        (curr).addClass("btn-outline-primary");
        curr = $(btn.target);
        $(btn.target).addClass("btn-primary");
        $(btn.target).removeClass("btn-outline-primary");
        currentHzSetting = $(btn.target).data("value");
    })

    $("#package-list").on("click", "button", async (btn) => {
        $(btn.target).attr("disabled", true);
        var packageName = $(btn.target).data("package-name")
        try {
            await SetResolution(packageName, currentResSetting);
            await currentHzSetting == "0" ? Remove90hz(packageName) : Enable90hz(packageName);
        } catch (err) {
            ShowError(err);
        }
        $(btn.target).parent().parent().find(".resolution").text(await GetResolution(packageName));
        $(btn.target).parent().parent().find(".hertz").text(await GetRefreshRate(packageName));
        $(btn.target).removeAttr("disabled");
    })

    setInterval(async () => {
        try {
            var device = await GetConnectedDevice();
            $("#connected-device").text(device);
        } catch (err) {
            $("#connected-device").text("None");
            ShowError(err);
        }
    }, 200)

    $("#set-all").click(() => {
        try {
            SetAllResolution(currentResSetting);
        } catch (err) {
            ShowError(err);
        }
    })

    // Error boxes
    $("#close-error").click(() => {
        $("#error-box").fadeOut();
    });
})

var html = (pckgname, res, hz) => `<tr>
  <th scope="row" class="package-name">${pckgname}</th>
  <td class="resolution">${res}</td>
  <td class="hertz">${hz}</td>
  <td class="button-holder"><button data-package-name="${pckgname}" class="btn btn-primary btn-block">Set</button></td>
</tr>`



function RefreshPackageList() {
    exec(adbPath + " shell pm list packages -3\"|cut -f 2 -d \":", async (err, data) => {
        $("#package-list").empty();
        var list = data.split("\n").sort();

        for (var i = 0; i < list.length; i++) {
            var str = list[i];
            if (str.length == 0) continue;
            str = str.trim();
            try {
                var res = await GetResolution(str);
                var hz = await GetRefreshRate(str);
                $(html(str, res, hz)).appendTo($("#package-list"));
            } catch (err) {
                ShowError(err);
            }
        }
    })
}
function GetConnectedDevice() {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell getprop", (err, data) => {
            if (err) return reject(err)
            resolve( data.match('ro.product.model.+\\[(.+)\\]')[1] );
        });
    })
}

function GetRefreshRate(packageName) {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell settings get global 90hz_" + packageName, (err, data) => {
            if (err) return reject(err)
            resolve(data.trim() == "null" ? "Default" : data.trim() == "1" ? "90hz" : "default");
        });
    })
}

function Enable90hz(packageName) {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell settings put global 90hz_" + packageName + " 1", (err, data) => {
            if (err) return reject(err)
            resolve();
        });
    })
}
function Remove90hz(packageName) {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell settings delete global 90hz_" + packageName, (err, data) => {
            if (err) return reject(err)
            console.log(data);
            resolve();
        });
    })
}

function ResetResolution(packageName) {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell settings delete global texture_size_" + packageName, (err, data) => {
            if (err) return reject(err)

            resolve();
        });
    })
}
function GetResolution(packageName) {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell settings get global texture_size_" + packageName, (err, data) => {
            if (err) return reject(err)

            resolve(data.trim() == "null" ? "Default" : data.trim());
        });
    })
}
function SetResolution(packageName, resolution) {
    if (resolution == 0) return ResetResolution(packageName);
    return new Promise((resolve, reject) => {
        exec(adbPath + ` shell settings put global texture_size_${packageName} ${resolution}`, (err, data) => {
            if (err) return reject(err)
            resolve(data.trim());
        });
    })
}

function GetResolution(packageName) {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell settings get global texture_size_" + packageName, (err, data) => {
            resolve(data.trim() == "null" ? "Default" : data.trim());
        });
    })
}

function SetAllResolution(resolution) {
    exec(adbPath + " shell pm list packages -3\"|cut -f 2 -d \":", (err, data) => {
        var list = data.split("\n");
        list.forEach(async str => {
            if (str.length == 0) return;
            str = str.trim();
            SetResolution(str, resolution);
        })
    })

    RefreshPackageList();
}

function ShowError(msg) {
    $("#error-message").text(msg);
    $("#error-box").fadeIn();
}