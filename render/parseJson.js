const { ipcRenderer, dialog } = require('electron')
const fs = require('fs')
const connectHelper = require('./connectHelper.js')
const mark = ['remarks', 'server', 'server_port', /*  'password', */ 'method', 'protocol', 'protocolparam', 'obfs', 'obfsparam']

let path = './electron-config.json'

exports.proxyData = {'configs':[]}

exports.refresh = () => {
	showProxyInfo(exports.proxyData['configs'])
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
				data = JSON.parse(data)
				if (data['configs'] !== undefined)
					configs = data['configs']
				else {
					configs = data
				}
				showProxyInfo(configs)
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
			showProxyInfo(JSON.parse(data.toString())['configs'])
		})
	}
})

// data must be pure proxy data
function showProxyInfo(data) {
	if (data === undefined)
		return
	tbody = document.getElementById('proxyInfo')
	while (tbody.firstChild){
		tbody.firstChild.remove()
	}
	if (data.length === undefined) {
		// object not array
		row = tbody.insertRow(tbody.rows.lenght)
		// row.dataset.index = index
		row.insertCell(0).innerHTML = 1
		i = 1
		mark.forEach(label => {
			row.insertCell(i).innerHTML = data[label]
			i++
		})
		connectHelper.addRightClickHandlerDdbclick(row)
	} else {
		data.forEach((element, index) => {
			row = tbody.insertRow(tbody.rows.lenght)
			// row.dataset.index = index
			row.insertCell(0).innerHTML = index
			i = 1
			mark.forEach(label => {
				row.insertCell(i).innerHTML = element[label]
				i++
			})
			connectHelper.addRightClickHandlerDdbclick(row)
		});
	}
	exports.proxyData = { 'configs': data }
	saveData()
}

function saveData() {
	dataToWrite = JSON.stringify(exports.proxyData)
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
				showProxyInfo(JSON.parse(data.toString())['configs'])
			})
		}
	})
}