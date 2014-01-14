/*common utils for the app */

/*
Stuffing into natives
*/

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


/* Gloabls */

var socket;

	initializeSocket = function(config) {
		console.log("Initializing socket");
		var SIGNALING_SERVER='';
		if(bakbakUrl.endsWith('/')) {
			SIGNALING_SERVER = bakbakUrl;
		} else {
			SIGNALING_SERVER = bakbakUrl +'/';
		}
       	var channel = config.customerId;
		var sender = config.visitorId;

		console.log('Declaring a new channel');
		io.connect(SIGNALING_SERVER).emit('new-channel', {
						channel: channel,
					        sender : sender
   		});


   		socket = io.connect(SIGNALING_SERVER + channel);

		
		socket.channel = channel;
		socket.on('connect', function () {
	      		if (config.callback) {
				config.callback(socket);
			}
			console.log('Setting id ' + socket.socket.sessionid);
			console.log(socket);
			config.id = socket.socket.sessionid;
			console.log("Got session " + config.id);
			config.presenceIndicator();
   		});

   		socket.send = function (message) { //Make it channel specific
        		socket.emit('message', {
            			sender: sender,
            			data  : message
        		});
    		};
    	//id should be the socketId to chat with
		socket.chat = function(message,id) {
			var data = {};
			data.type = 'chat';
			data.message = message;
			data.reciever = id;
			data.sender = sender;
			console.log('Sending chat to ' +  id);
			socket.emit('chat',data);
		};

		socket.call = function(video,id,request,data) {
			if(!data)
				data = {};
			data.video = video;
			data.request = request;
			data.reciever = id;
			data.sender = sender;
			console.log('Calling/Responding to ' +  id  + ' ' + sender );
			console.log(data);
			socket.emit('call',data);
		};

		socket.presence = function(visitor) { //make it channel specific
			socket.emit('presence',{
				sender : sender,
				data : visitor //should change in future with the visitor data.
				});
		};

   		socket.on('message', config.onMessage);
		socket.on('presence',config.onPresence);
		socket.on('chat',config.onChat);
		socket.on('call',config.onCall);
	};
	
	heartbeat = function(data) {
		console.log("Sending presence!");
		socket.presence(data);
	};

	initializeCalling = function() {
		navigator.getUserMedia = navigator.getUserMedia ||
			  navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

		var constraints = {video: true, audio : true};

		function successCallback(localMediaStream) {
			  window.stream = localMediaStream; // stream available to console
			  console.log("Success in getting user media!");
			    var video = document.querySelector("video");
			      video.src = window.URL.createObjectURL(localMediaStream);
			        video.play();
		}

		function errorCallback(error){
			  console.log("navigator.getUserMedia error: ", error);
		}

		navigator.getUserMedia(constraints, successCallback, errorCallback);

	};

	addToChatMessageBox = function(visitorId,senderName,chatText) {
		var chatBox = $('#chatMsgBox'); 
		if(visitorId) {
			chatBox = $('#chatMsgBox'+visitorId);
		}
		chatBox.append('<small><br>'+senderName+': '+chatText+'</small>');
  		chatBox.scrollTop(9999999999);
	}

	initializeWebRTCSupport = function(data) {
				var webrtcsupport = require('webrtcsupport');
				console.log(webrtcsupport);
				data.webrtc=webrtcsupport;
	}

	initializeLocationData = function(self) {
		$.getJSON( bakbakUrl + "location", function(data) {
					console.log(data);
					self.location = data;
					});
	}
	initializeGoogleAnalyticsData = function(self) {
		self.gAData = {};
		self.gAData = fillCookieData(self.gAData,'__utma');
		self.gAData = fillCookieData(self.gAData,'__utmz');
		self.gAData = fillCookieData(self.gAData,'__utmx');
		self.gAData = fillCookieData(self.gAData,'__utmc');
		self.gAData = fillCookieData(self.gAData,'__utmb');
		self.gAData = fillCookieData(self.gAData,'__utmv');
		self.gAData = fillCookieData(self.gAData,'__utmcmd');
		self.gAData = fillCookieData(self.gAData,'__utmcsr');
		self.gAData = fillCookieData(self.gAData,'__utmcct');
		self.gAData = fillCookieData(self.gAData,'__utmccn');
		self.gAData = fillCookieData(self.gAData,'__utmctr');
		self.gAData = fillCookieData(self.gAData,'__utmclid');

	}


/* Contants */
var CUSTOMER_HEARTBEAT = 30*1000;//10000;
var VISITOR_HEARTBEAT = 60*1000;//15000;
var CUSTOMER_MONITOR = 40*1000;//20000;
var VISITOR_MONITOR = 80*1000;//20000;

/* Browser Detects starts here */
var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{
			string: navigator.userAgent,
			subString: "Chrome",
			identity: "Chrome"
		},
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari",
			versionSearch: "Version"
		},
		{
			prop: window.opera,
			identity: "Opera",
			versionSearch: "Version"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			   string: navigator.userAgent,
			   subString: "iPhone",
			   identity: "iPhone/iPod"
	    },
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]

};
BrowserDetect.init();
/* Browser Detect completed here */
/* Other utils methods here */
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function fillCookieData(obj,cookieName) {
		obj[cookieName] = readCookie(cookieName);
		return obj;
	}

function getMapContent(locationName,latitude,longitude) {
	return "<img src='http://maps.googleapis.com/maps/api/staticmap?center="+locationName+"&zoom=10&size=300x200&sensor=false&markers=color:blue%7Clabel:S%7C"+latitude+","+longitude+"' />"
}

function getRandom() {
	return  Math.round(Math.random() * 60535) + 5000;
}
