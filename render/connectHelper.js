/**
 * start SSR connection
 * terminate SSR connection
 */


const { ipcRenderer } = require('electron')
const { exec } = require('child_process')
const manageSSR = require('./manageSSR.js')
const remote = require('electron').remote
const dialog = remote.dialog
const fs = require('fs')
const option = {
    '-s': 'server',
    '-p': 'server_port',
    '-k': 'password',
    '-m': 'method',
    '-O': 'protocol',
    '-G': 'protocolparam',
    '-o': 'obfs',
    '-g': 'obfsparam'
}

let subThread = -1, ssrLocation = '', path = remote.getGlobal('exePath') + '/settings.json'

/**
 * Read settings from file
 * post: ssrLocation should be assigned if settings file exists
 */
fs.open(path, 'r', (err, fd) => {
    if (err) {
        console.log(err)
    } else {
        fs.readFile(fd, (err, data) => {
            if (err)
                console.log(err)
            else {
                if (data)
                    ssrLocation = JSON.parse(data)['ssrLocation']
            }
        })
    }
})

ipcRenderer.on('SSR-location', (event, directory) => {
    console.log(directory)
    ssrLocation = directory
    let dataToWrite = JSON.stringify({ ssrLocation: directory })
    fs.writeFile(path, dataToWrite, (err) => {
        if (err)
            console.log(err)
    })
})

ipcRenderer.on('Terminate-all-threads', () => {
    exec('ps -ef|grep local.py', (err, stdout) => {
        if (err) {
            console.log(err)
        }
        else {
            let threads = stdout.match(/anderson(.*)?python(.*)?local.py/g)
            connectState(false)
            if (threads)
                threads.forEach((e) => {
                    exec(`kill ${e.match(/[0-9]+/)[0]}`, (err, stdout, stderr) => {
                        if (err) console.log(err)
                        else {
                            console.log(`Terminate Thread: ${e.match(/[0-9]+/)[0]} \n ${stdout} \n ${stderr}`)
                        }
                    })
                })
        }
    })
})

ipcRenderer.on('Terminate-before-close-app', () => {
    if (require('./viewEditor.js').getState()) {
        dialog.showMessageBox({
            type: 'warning',
            buttons: ['Terminate all connect', 'Cancel'],
            defaultId: 1,
            message: 'You have already connect to a proxy server.\nQuit this app will terminate all connections!',
            cancelId: 1,
        }, (response) => {
            if (response == 0) {
                connectState(false)
                terminateConnection()
                ipcRenderer.send('quit-app')
            }
        })
    } else {
        ipcRenderer.send('quit-app')
    }
})

function getFullCmd(index) {
    let data = manageSSR.getDataByIndex(index), cmd = ''
    for (const key in option) {
        cmd += ` ${key} "${data[option[key]]}"`
    }
    return cmd
}

function startConnection(index) {
    subThread = exec(`python ${ssrLocation} ${getFullCmd(index)}`, (err, stdout, stderr) => {
        if (err) {
            if (stderr.search("ERROR") != -1) {
                connectState(false)
                let errorM = []
                stderr.split('\n').forEach((e) => {
                    if (e.search("ERROR") != -1)
                        errorM.push(e);
                })
                stderr = errorM.join('\n')
                showErrorMessage({
                    title: '错误信息',
                    body: stderr
                })
            }
            console.log(err)
            connectState(false)
        } else {
            console.log(`std out: ${stdout}`)
            console.log(`std err: ${stderr}`)
        }
    }).pid
    console.log(`Connect : #${index}  Thread id : ${subThread}`)
}

function terminateConnection() {
    if (subThread === -1)
        return
    exec(`pkill -P ${subThread}`)
    console.log(`Terminate : ${subThread}`)
    subThread = -1
}

function showErrorMessage(notification) {
    new window.Notification(notification.title, notification)
}

document.addEventListener("StartConnection", (e) => {
    connectState(true, e.detail.tr)
    startConnection(e.detail.index)
})

document.addEventListener("TerminateConnection", () => {
    connectState(false)
    terminateConnection()
})

document.addEventListener("ForceStartConnection", (e) => {
    terminateConnection()
    connectState(true, e.detail.tr)
    startConnection(e.detail.index)
})

function connectState(isSucccess, tr) {
    if (isSucccess)
        require('./viewEditor.js').setState(true, tr)
    else
        require('./viewEditor.js').setState(false)
}
