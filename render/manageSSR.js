/**
 * read SSR from JSON
 * save SSR to file
 * store SSR in memory
 * notify view update
 */

const remote = require('electron').remote
const { ipcRenderer } = require('electron')
const fs = require('fs')
const viewEditor = require('./viewEditor.js')
const exec = require('child_process').exec
let path = remote.getGlobal('exePath') + '/electron-config.json', proxyData = { 'configs': [] }

exports.refresh = () => {
    viewEditor.showProxyInfo(proxyData['configs'])
    saveData()
}

exports.getDataByIndex = (index) => proxyData['configs'][index]

exports.getAllData = () => proxyData['configs']

exports.updateAllData = (data) => {
    proxyData['configs'] = data
}

ipcRenderer.on('file-to-open', (event, filePath) => {
    console.log(filePath)
    if (filePath.length != 1)
        alert('Cannot open file! Please check!')
    else {
        fs.readFile(filePath[0], 'utf-8', (err, data) => {
            if (err) {
                alert('An error occur when reading file ' + err.message)
                return
            } else {
                let configs
                data = JSON.parse(data)
                if (data['configs'] !== undefined)
                    configs = data['configs']
                else {
                    configs = data
                }
                viewEditor.showProxyInfo(configs)
                saveData()
            }
        })
    }
})

fs.open(path, 'r', (err, fd) => {
    if (err) {
        console.log(err)
    } else {
        fs.readFile(fd, (err, data) => {
            if (err)
                console.log(err)
            else {
                viewEditor.showProxyInfo(JSON.parse(data.toString())['configs'])
                saveData()
            }
        })
    }
})

function saveData() {
    let dataToWrite = JSON.stringify(proxyData)
    fs.writeFile(path, dataToWrite, (err) => {
        if (err)
            console.log(err)
    })
}

exports.checkData = () => {
    fs.open(path, 'r', (err, fd) => {
        if (err) {
            console.log(err)
        } else {
            fs.readFile(fd, (err, data) => {
                if (err)
                    console.log(err)
                else {
                    viewEditor.showProxyInfo(JSON.parse(data.toString())['configs'])
                    saveData()
                }
            })
        }
    })
}

function parseSSRLink(data) {
    if (data.indexOf('ssr://') == -1) {
        return
    }
    data = data.substring(data.indexOf('ssr://') + 6).trim()
    let deocoded_data = Buffer.from(data, 'base64').toString('utf-8').split(':'),
        other_data = deocoded_data[5].substring(deocoded_data[5].indexOf('/?') + 2),
        search = new URLSearchParams(other_data),
        pwd = Buffer.from(deocoded_data[5].substring(0, deocoded_data[5].indexOf('/?')), 'base64').toString('utf-8'),
        pp, op, r, g
    pp = ((pp = search.get('protoparam')) == null) ? pp : pp.replace(/ /g, '+')
    op = ((op = search.get('obfsparam')) == null) ? op : op.replace(/ /g, '+')
    r = ((r = search.get('remarks')) == null) ? r : r.replace(/ /g, '+')
    g = ((g = search.get('group')) == null) ? g : g.replace(/ /g, '+')
    let data_to_insert = {
        server: deocoded_data[0],
        server_port: deocoded_data[1],
        password: pwd,
        protocol: deocoded_data[2],
        method: deocoded_data[3],
        protocolparam: pp ? Buffer.from(pp, 'base64').toString('utf-8') : '',
        obfs: deocoded_data[4],
        obfsparam: op ? Buffer.from(op, 'base64').toString('utf-8') : '',
        remarks: r ? Buffer.from(r, 'base64').toString('utf-8') : undefined,
        group: g ? Buffer.from(g, 'base64').toString('utf-8') : ''
    }
    proxyData['configs'].push(data_to_insert)
}

function getEditedData() {
    return {
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
    };
}

exports.addData_link = () => {
    let links = document.getElementById('proxyLinks').value
    links.trim()
    let seperator = ''
    if (links.indexOf(';') != -1) {
        seperator = ';'
    } else if (links.indexOf('\n') != -1) {
        seperator = '\n'
    }
    if (seperator === '') {
        parseSSRLink(links)
    } else {
        let all = links.split(seperator)
        all.forEach((e) => {
            parseSSRLink(e)
        })
    }
    exports.refresh()
}

exports.updateData = () => {
    let index = document.getElementById('proxyDataForm').dataset.index
    proxyData['configs'][index] = getEditedData()
    exports.refresh()
}

exports.addData_detail = () => {
    let newData = getEditedData()
    proxyData['configs'].push(newData)
    exports.refresh()
}

exports.addData_rss = () => {
    let rss_url = document.getElementById('proxyRSS').value
    exec(`curl ${rss_url}`, (err, stdout) => {
        if (err)
            console.log(err)
        else {
            let all_ssrs = Buffer.from(stdout, 'base64').toString('utf-8')
            all_ssrs.trim()
            let seperator = ''
            if (all_ssrs.indexOf(';') != -1) {
                seperator = ';'
            } else if (all_ssrs.indexOf('\n') != -1) {
                seperator = '\n'
            }
            if (seperator === '') {
                parseSSRLink(all_ssrs)
            } else {
                let all = all_ssrs.split(seperator)
                all.forEach((e) => {
                    parseSSRLink(e)
                })
            }
            exports.refresh()
        }
    })
}