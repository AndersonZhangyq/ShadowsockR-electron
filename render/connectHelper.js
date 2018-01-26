const remote = require('electron').remote
const { ipcRenderer } = require('electron')
const { exec } = require('child_process')
const parseJson = require('./parseJson.js')
const dialog = remote.dialog
const Menu = remote.Menu
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

let hasConnected = false, connectTr,
    subThread, ssrLocation = '', path = './settings.json'

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

ipcRenderer.on('Add-Proxy-by-SSR-link', (event, links) => {
    $('#add-proxy-by-link').modal('toggle')
    console.log(links)
})

ipcRenderer.on('SSR-location', (event, directory) => {
    console.log(directory)
    ssrLocation = directory
    dataToWrite = JSON.stringify({ ssrLocation: directory })
    fs.writeFile(path, dataToWrite, (err) => {
        if (err)
            console.log(err)
    })
})

ipcRenderer.on('Terminate-all-threads', (event, directory) => {
    exec('ps -ef|grep local.py', (err, stdout, stderr) => {
        if (err) console.log(err)
        else {
            threads = stdout.match(/anderson(.*)?python(.*)?local.py/g)
            hasConnected = false
            if (connectTr)
                connectTr.className = ''
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

ipcRenderer.on('Add-Proxy-by-detail', (event, directory) => {
    $('#edit-proxy-data').modal('toggle')
    document.getElementById('addButton').style = ''
    document.getElementById('confirmButton').style = 'display: none'
})

exports.addRightClickHandler = (tr) => {
    tr.oncontextmenu = (e) => {
        const tr = e.currentTarget
        isConnected = tr.className !== ''
        const index = tr.firstChild.innerHTML
        const rightClickMenu = [
            {
                label: 'Connect',
                enabled: !isConnected,
                click: () => {
                    if (hasConnected) {
                        dialog.showMessageBox({
                            type: 'warning',
                            buttons: ['Force Connect', 'Cancel'],
                            defaultId: 1,
                            message: 'You have already connect to a proxy server.\nIf you want to connect this one, the origin connection will be terminated!\nAre you sure you want to force connect this proxy server?',
                            cancelId: 1,
                        }, (response) => {
                            if (response == 0) {
                                tr.className = 'success'
                                hasConnected = true
                                connectTr.className = ''
                                terminateConnection()
                                connectTr = tr
                                startConnection(index)
                            }

                        })
                    } else {
                        tr.className = 'success'
                        hasConnected = true
                        connectTr = tr
                        startConnection(index)
                    }
                }
            }, {
                label: 'Disconnect',
                enabled: isConnected,
                click: () => {
                    tr.className = ''
                    hasConnected = false
                    connectTr = null
                    terminateConnection()
                }
            }, {
                label: 'Edit',
                click: () => {
                    originData = parseJson.proxyData['configs'][index]
                    $('#edit-proxy-data').modal('toggle')
                    document.getElementById('confirmButton').style = ''
                    document.getElementById('addButton').style = 'display: none'
                    document.getElementById('proxyDataForm').dataset.index = index
                    document.getElementById('server').value = originData['server']
                    document.getElementById('server_port').value = originData['server_port']
                    document.getElementById('password').value = originData['password']
                    document.getElementById(`${originData['method']}`).selected = 'selected'
                    document.getElementById(`${originData['protocol']}`).selected = 'selected'
                    document.getElementById('protocolparam').value = originData['protocolparam']
                    document.getElementById(`${originData['obfs']}`).selected = 'selected'
                    document.getElementById('obfsparam').value = originData['obfsparam']
                    document.getElementById('remarks').value = originData['remarks']
                }
            }, {
                label: 'Delete',
                enabled: !isConnected,
                click: () => {
                    parseJson.proxyData.configs.splice(index, 1)
                    parseJson.refresh()
                }
            }
        ]

        menu = Menu.buildFromTemplate(rightClickMenu)
        e.preventDefault()
        menu.popup(remote.getCurrentWindow)
    }
}

function getFullCmd(index) {
    data = parseJson.proxyData.configs[index]
    cmd = ''
    for (const key in option) {
        cmd += ` ${key} "${data[option[key]]}"`
    }
    return cmd
}

function startConnection(index) {
    subThread = exec(`python ${ssrLocation} ${getFullCmd(index)}`, (err, stdout, stderr) => {
        if (err) {
            showErrorMessage({
                title: '错误信息',
                body: stderr
            })
            console.log(err)
            hasConnected = false
            if (connectTr) {
                connectTr.className = ''
            }
        } else {
            console.log(`std out: ${stdout}`)
            console.log(`std err: ${stderr}`)
        }
    }).pid
    console.log(`Connect : ${connectTr}  Thread id : ${subThread}`)
}

function terminateConnection() {
    exec(`pkill -P ${subThread}`)
    console.log(`Terminate : ${subThread}`)
}

exports.addData_link = () => {
    links = document.getElementById('proxyLinks').value
    links.trim()
    seperator = ''
    if (links.indexOf(';') != -1) {
        seperator = ';'
    } else if (links.indexOf('\n') != -1) {
        seperator = '\n'
    }
    if (seperator === '') {
        parseSSRLink(links)
    } else {
        all = links.split(seperator)
        all.forEach((e) => {
            parseSSRLink(e)
        })
    }
    parseJson.refresh()
}

function parseSSRLink(data) {
    if (data.indexOf('ssr://') == -1){
        return
    }
    data = data.substring(data.indexOf('ssr://') + 6).trim()
    deocoded_data = Buffer.from(data, 'base64').toString('utf-8').split(':')
    other_data = deocoded_data[5].substring(deocoded_data[5].indexOf('/?') + 2)
    search = new URLSearchParams(other_data)
    pwd = Buffer.from(deocoded_data[5].substring(0, deocoded_data[5].indexOf('/?')), 'base64').toString('utf-8')
    pp = search.get('protocoparam')
    op = search.get('obfsparam')
    r = search.get('remarks')
    g = search.get('group')
    data_to_insert = {
        server: deocoded_data[0],
        server_port: deocoded_data[1],
        password: pwd,
        method: deocoded_data[2],
        protocol: deocoded_data[3],
        protocolparam: pp ? Buffer.from(pp, 'base64').toString('utf-8') : '',
        obfs: deocoded_data[4],
        obfsparam: op ? Buffer.from(op, 'base64').toString('utf-8') : '',
        remarks: r ? Buffer.from(r, 'base64').toString('utf-8') : undefined,
        group: g ? Buffer.from(g, 'base64').toString('utf-8') : ''
    }
    parseJson.proxyData['configs'].push(data_to_insert)
}

exports.updateData = () => {
    index = document.getElementById('proxyDataForm').dataset.index
    parseJson.proxyData['configs'][index] = getEditedData()
    parseJson.refresh()
}

exports.addData_detail = () => {
    newData = getEditedData()
    parseJson.proxyData['configs'].push(newData)
    parseJson.refresh()
}

function getEditedData() {
    newData = {
        server: document.getElementById('server').value,
        server_port: document.getElementById('server_port').value,
        password: document.getElementById('password').value,
        method: document.getElementById('method').selectedOptions[0].id,
        protocol: document.getElementById('protocol').selectedOptions[0].id,
        protocolparam: document.getElementById('protocolparam').value,
        obfs: document.getElementById('obfs').selectedOptions[0].id,
        obfsparam: document.getElementById('obfsparam').value,
        remarks: document.getElementById('remarks').value,
        group: ''
    }
    return newData;
}

function showErrorMessage(notification) {
    const myNotification = new window.Notification(notification.title, notification)
}
