const { exec } = require('child_process');
var $;

const adbPath = `C:\\Users\\Sam\\Desktop\\Electron\\adb.exe`

function GetConnectedDevice() {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell getprop", (err, data) => {
            if (err) return reject(err)
            resolve( data.match('ro.product.model.+\\[(.+)\\]')[1] );
        });
    })
}

function ResetResolution(packageName) {
    return new Promise((resolve, reject) => {
        exec(adbPath + " shell settings delete global texture_size_" + packageName, (err, data) => {
            if (err) return reject(err)

            resolve(data.trim() == "null" ? "Default" : data.trim());
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

 function RefreshPackageList() {
    exec(adbPath + " shell pm list packages -3\"|cut -f 2 -d \":", async (err, data) => {
        $("#package-list").empty();
        var list = data.split("\n").sort();

        for (var i = 0; i < list.length; i++) {
            var str = list[i];
            if (str.length == 0) continue;
            str = str.trim();
            var res = await GetResolution(str);
            $(html(str, res)).appendTo($("#package-list"));
        }
    })
}

window.addEventListener('DOMContentLoaded', () => {
    $ = require('jquery');
    const ipcRenderer = require('electron').ipcRenderer; 
    var currentResSetting = 0;

    RefreshPackageList();

    $("#refresh-packages").click(RefreshPackageList);

    $("#settings").on("click", ".btn", (btn) => {
        var curr = $("#settings > .btn-primary");
        (curr).removeClass("btn-primary");
        (curr).addClass("btn-outline-primary");
        curr = $(btn.target);
        $(btn.target).addClass("btn-primary");
        $(btn.target).removeClass("btn-outline-primary");
        currentResSetting = $(btn.target).data("resolution");
    })

    $("#package-list").on("click", "button", async (btn) => {
        $(btn.target).attr("disabled", true);
        var packageName = $(btn.target).data("package-name")
        await SetResolution(packageName, currentResSetting);
        $(btn.target).parent().parent().find(".resolution").text(await GetResolution(packageName));
        $(btn.target).removeAttr("disabled");
    })

    setInterval(async () => {
        try {
            var device = await GetConnectedDevice();
            $("#connected-device").text(device);
        } catch (err) {
            $("#connected-device").text("None");
        }
    }, 200)

    $("#set-all").click(() => {
        SetAllResolution(currentResSetting);
    })
})

var html = (pckgname, res) => `<tr>
  <th scope="row" class="package-name">${pckgname}</th>
  <td class="resolution">${res}</td>
  <td class="button-holder"><button data-package-name="${pckgname}" class="btn btn-primary btn-block">Set</button></td>
</tr>`