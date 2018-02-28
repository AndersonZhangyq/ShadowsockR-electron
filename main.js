const { app, Menu, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const { exec } = require('child_process')

let win

function createWindow() {
	win = new BrowserWindow({
		width: 800,
		height: 600,
		show: false,
		icon: path.join(__dirname, 'ssr_64x64.png')
	})

	win.once('ready-to-show', () => {
		win.show()
	})

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	//  win.webContents.openDevTools()

	win.on('close', windows_close)

	win.on('closed', () => {
		win = null
	})
}

function windows_close(e) {
	e.preventDefault();
	win.webContents.send('Terminate-before-close-app')
}

var menuBar = [
	{
		label: 'File',
		submenu: [
			{
				label: 'Open File',
				accelerator: 'Control+O',
				click: function () {
					properties = ['createDirectory', 'openFile'],
						parentWindow = (process.platform == 'darwin') ? null : BrowserWindow.getFocusedWindow();

					dialog.showOpenDialog(parentWindow, properties, function (f) {
						if (f != null) // if user click 'cancel' then f is null
							win.webContents.send('file-to-open', f)
					});
				}
			},
			{
				role: 'quit'
			},
		]
	},
	{
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ role: 'toggledevtools' },
			{ type: 'separator' },
			{ role: 'resetzoom' },
			{ role: 'zoomin' },
			{ role: 'zoomout' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
		]
	},
	{
		label: 'Proxy',
		submenu: [
			{
				label: 'SSR location',
				click: () => {
					properties = ['openDirectory'/*  , 'openFile' */],
						parentWindow = (process.platform == 'darwin') ? null : BrowserWindow.getFocusedWindow();

					dialog.showOpenDialog(parentWindow, properties, function (f) {
						if (f != null) // if user click 'cancel' then f is null
							win.webContents.send('SSR-location', f)
					});
				}
			},
			{
				label: 'Terminate all thread',
				click: () => {
					win.webContents.send('Terminate-all-threads')
				}
			},
			{
				label: 'Add Proxy by RSS',
				click: () => {
					win.webContents.send('Add-Proxy-by-RSS')
				}
			},
			{
				label: 'Add Proxy by SSR link',
				click: () => {
					win.webContents.send('Add-Proxy-by-SSR-link')
				}
			},
			{
				label: 'Add Proxy by detail',
				click: () => {
					win.webContents.send('Add-Proxy-by-detail')
				}
			},
		]
	},
	{
		role: 'help',
		submenu: [
			{
				label: 'Learn More',
				click() { require('electron').shell.openExternal('https://electronjs.org') }
			}, {
				label: 'Electron version: ' + process.versions.electron,
				enabled: false
			}, {
				label: 'V8 version: ' + process.versions.chrome,
				enabled: false
			}
		]
	}
]

if (process.platform === 'darwin') {
	menuBar.unshift({
		label: app.getName(),
		submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			{ role: 'services', submenu: [] },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideothers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' }
		]
	})

	// Edit menu
	menuBar[1].submenu.push(
		{ type: 'separator' },
		{
			label: 'Speech',
			submenu: [
				{ role: 'startspeaking' },
				{ role: 'stopspeaking' }
			]
		}
	)

	// Window menu
	menuBar[3].submenu = [
		{ role: 'close' },
		{ role: 'minimize' },
		{ role: 'zoom' },
		{ type: 'separator' },
		{ role: 'front' }
	]
}

menu = Menu.buildFromTemplate(menuBar);

Menu.setApplicationMenu(menu);

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit()
})

app.on('activate', () => {
	createWindow()
})

ipcMain.on('quit-app', () => {
	win.removeListener('close', windows_close)
	app.quit()
})
