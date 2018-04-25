/**
 * change the view
 * maintain connection display
 */

const remote = require('electron').remote
const Menu = remote.Menu
const dialog = remote.dialog
const { ipcRenderer } = require('electron')
const manageSSR = require('./manageSSR.js')
const mark = ['remarks', 'server', 'server_port', /*  'password', */ 'method', 'protocol', 'protocolparam', 'obfs', 'obfsparam']

var hasConnected = false, connectTr = null

exports.setState = (has_connected, tr) => {
    hasConnected = has_connected
    if (hasConnected == false) {
        if (connectTr != null)
            connectTr.className = ''
        connectTr = null
    } else {
        connectTr = tr
        connectTr.className = 'success'
    }
}

exports.showProxyInfo = (data) => {
    let tbody
    if (data === undefined)
        return
    tbody = document.getElementById('proxyInfo')
    while (tbody.firstChild) {
        tbody.firstChild.remove()
    }
    if (data.length === undefined) {
        let row
        // object not array
        row = tbody.insertRow(tbody.rows.lenght)
        // row.dataset.index = index
        row.insertCell(0).innerHTML = 1
        let i = 1
        mark.forEach(label => {
            row.insertCell(i).innerHTML = data[label]
            i++
        })
        exports.addRightClickHandlerDdbclick(row)
    } else {
        data.forEach((element, index) => {
            let row
            row = tbody.insertRow(tbody.rows.lenght)
            // row.dataset.index = index
            row.insertCell(0).innerHTML = index
            let i = 1
            mark.forEach(label => {
                row.insertCell(i).innerHTML = element[label]
                i++
            })
            exports.addRightClickHandlerDdbclick(row)
        });
    }
    manageSSR.updateAllData(data)
}

ipcRenderer.on('Add-Proxy-by-SSR-link', () => {
    $('#add-proxy-by-link').modal('toggle')
})

ipcRenderer.on('Add-Proxy-by-RSS', () => {
    $('#add-proxy-by-rss').modal('toggle')
})

ipcRenderer.on('Add-Proxy-by-detail', () => {
    $('#edit-proxy-data').modal('toggle')
    document.getElementById('addProxy_detail').style = ''
    document.getElementById('confirmButton').style = 'display: none'
})

exports.addRightClickHandlerDdbclick = (tr) => {
    tr.oncontextmenu = (e) => {
        const tr = e.currentTarget
        let isConnected = tr.className !== ''
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
                                hasConnected = true
                                connectTr.className = ''
                                document.dispatchEvent(new CustomEvent('ForceStartConnection', {
                                    detail: {
                                        'index': index,
                                        'tr': tr
                                    }
                                }))
                            }

                        })
                    } else {
                        hasConnected = true
                        document.dispatchEvent(new CustomEvent('StartConnection', {
                            detail: {
                                'index': index,
                                'tr': tr
                            }
                        }))
                    }
                }
            }, {
                label: 'Disconnect',
                enabled: isConnected,
                click: () => {
                    hasConnected = false
                    document.dispatchEvent(new CustomEvent('TerminateConnection'))
                }
            }, {
                label: 'Edit',
                click: () => {
                    let originData = manageSSR.getDataByIndex(index)
                    $('#edit-proxy-data').modal('toggle')
                    document.getElementById('confirmButton').style = ''
                    document.getElementById('addProxy_detail').style = 'display: none'
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
                    manageSSR.getAllData().splice(index, 1)
                    manageSSR.refresh()
                }
            }
        ]
        let menu = Menu.buildFromTemplate(rightClickMenu)
        e.preventDefault()
        menu.popup(remote.getCurrentWindow)
    }
    tr.ondblclick = (e) => {
        const tr = e.currentTarget
        const index = tr.firstChild.innerHTML
        if (hasConnected) {
            dialog.showMessageBox({
                type: 'warning',
                buttons: ['Force Connect', 'Cancel'],
                defaultId: 1,
                message: 'You have already connect to a proxy server.\nIf you want to connect this one, the origin connection will be terminated!\nAre you sure you want to force connect this proxy server?',
                cancelId: 1,
            }, (response) => {
                if (response == 0) {
                    hasConnected = true
                    connectTr.className = ''
                    document.dispatchEvent(new CustomEvent('ForceStartConnection', {
                        detail: {
                            'index': index,
                            'tr': tr
                        }
                    }))
                }

            })
        } else {
            hasConnected = true
            document.dispatchEvent(new CustomEvent('StartConnection', {
                detail: {
                    'index': index,
                    'tr': tr
                }
            }))
        }
    }
}

exports.getState = () => hasConnected
