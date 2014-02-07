(function() {
 	window.Visitor = function(customerId) { //CustomerId is the admin with whom this guy is connected to.
 		getUserId = function() {
			var userId = readCookie('bakbakUserId');
			if(userId == null) {
				userId = getGUID();
				createCookie('bakbakUserId',userId,999);
			}
			return userId;
		}
		//Extract a method
		this.visitorName = readCookie('bakbakchatVisitorName') ? readCookie('bakbakchatVisitorName') : 'Unknown';
		this.adminOnline = false;
		this.lastOnline = null;
		this.adminId = null;
		this.customerId = customerId;
		this.webrtc = null;
		this.location = null;
		this.adminSocketId=null;
		//this.geolocation = window.navigator.geolocation;
		this.browser = BrowserDetect.browser;
		this.os = BrowserDetect.OS;
		this.version = BrowserDetect.version;
		this.gAData = null;
		this.id = null; //socketid will be stored here.
		this.call = new Call(customerId);
		this.visitorId = getUserId();
		this.presenceIndicator = function () {
			heartbeat(self);
		}
		var self = this;
		function setAdminStatus(status) {
			if(status) {
				addOnlineLabel();
			}else {
				addOfflineLabel();
			}
		}
		this.adminMonitor = function() {
					if(self.lastOnline == null || !self.adminOnline) {
						//First time check or offline customer
						self.lastOnline = new Date().getTime()-5; //dont want to wait 2 cycles!
						self.adminOnline=true;
						setTimeout(self.adminMonitor, CUSTOMER_MONITOR);
						return;
					}
					var now = new Date().getTime();
					var timeDiff = now - self.lastOnline;
					if(timeDiff > CUSTOMER_MONITOR) {
						console.log("Customer is offline at " + now);
						if(self.adminOnline) {
							self.adminOnline = false;
							setAdminStatus(false);
						}
					}
					setTimeout(self.adminMonitor, CUSTOMER_MONITOR);
		};
		this.init = function() {
			$('#chatPanel').hide();
			initializeStatusUi();
			$('#offlineIndicator').show();
			initializeWebRTCSupport(self);
			initializeLocationData(self);
			initializeGoogleAnalyticsData(self);
			initializeSocket(self);
			heartbeat(self);
			self.adminMonitor();
			//console.log(self.navigator);
			//initialize_calling();
			$(document).ready(function(){
				var bodyHeight = $("body").height();
                var vwptHeight = $(window).height();
                if (vwptHeight > bodyHeight) {
                 	$("footer#bakbakchat").css("position","absolute").css("bottom",0);
                }
			});
		}

		initializeStatusUi = function() {
			$("body").append("<footer id='bakbakchat' style='width:150px;z-index:99999;margin:0;position:fixed;bottom:0px' class='table-bordered backgroundGray'></footer>");
			if(readCookie('bakbakchatOnline')) {
				//addOnlineLabel();
				setAdminStatus(true);
			} else {
				//addStatusCheckLabel();
				addOfflineLabel();
			}
		};

		addStatusCheckLabel = function() {
			$('#bakbakchat').empty();
			$('#bakbakchat').width('150px');
			$('#bakbakchat').append("<p id='offlineCheck' class='alert alert-info' style='margin:0px'>Support<img src='"+bakbakUrl+"img/actions/png/spinner.gif'/></p>");
		}

		showContactUsBar = function () {
			if($('#contactUsPanel').length) {
				if($('#contactUsPanel').is(':visible')) {
					console.log("Hiding Contact Us bar!");
					//$('#chatMsg').blur();
					$('#contactUsPanel').hide();
					$('#bakbakchat').width('150px');
				} else {
					console.log("Showing chat bar!");
					$('#contactUsPanel').show();
					//$('#chatMsg').focus();
					$('#bakbakchat').width('260px');
				}
				return;
			}
			console.log("Showing chat bar!");
			$('#bakbakchat').append("<div id='contactUsPanel' class='contactUsPanel'> \
				<form id='contactUsForm' data-toggle='validator' role='form'> \
				<div class='form-horizontal'> \
  					<div class='control-group'> \
    					<input name='email' type='email' id='inputEmail' placeholder='Email' required> \
    				 </div> \
  					<div class='control-group'> \
    					<input name='number' pattern='^([+0-9]){3,}$' type='text' placeholder='Contact Number'> \
    				</div> \
  					<div class='control-group'> \
    					<textarea  name='message' rows='3' placeholder='Message' required/> \
    				</div> \
  					<button id='contactUsButton' type='submit' class='btn'>Send</button> \
    			</div> \
    			</form> \
		</div>");
			$('#contactUsForm').on( 'submit' ,function(event) {
				event.preventDefault();
				sendContactUsForm($(this).serialize());
			});
			$('#bakbakchat').width('260px');
			$('#chatMsg').focus();
			if(!self.adminSocketId) {
						$('#chatMsg').attr('disabled', 'disabled');
						$('#chatSendButton').attr('disabled', 'disabled');
					}
		}


		showChatBar = function(showByDefault) {
			if($('#chatPanel').length) {
				if($('#chatPanel').is(':visible') && 
					(showByDefault == undefined || !showByDefault)) {
					console.log("Hiding chat bar!");
					$('#chatMsg').blur();
					$('#chatPanel').hide();
					$('#bakbakchat').width('150px');
				} else {
					console.log("Showing chat bar!");
					$('#chatPanel').show();
					$('#chatMsg').focus();
					$('#bakbakchat').width('260px');
					console.log('Admin socket id is ' + self.adminSocketId);
					if(!self.adminSocketId) {
						$('#chatMsg').attr('disabled', 'disabled');
						$('#chatSendButton').attr('disabled', 'disabled');
					}
				}
				return;
			}
			console.log("Showing chat bar!");
			$('#bakbakchat').append("<div id='chatPanel' class='chatPanel'> \
			<div id='chatMsgBox' class='chatMessages maxHeight100 scrollbar'></div> \
			<div class='chatText input-append' style='margin:0;width:100%'> \
  				<input class='input-block-level' id='chatMsg' type='text' placeholder='Chat'> \
			</div> \
		</div>");
			$('#chatMsg').keydown(function(event) {
				if (event.keyCode == 13) {
					sendChatMessage($('#chatMsg').val());
					event.preventDefault();
				}
			});
			$('#chatSendButton').click(function() {
				sendChatMessage($('#chatMsg').val());
			});
			$('#bakbakchat').width('260px');
			$('#chatMsg').focus();
			if(!self.adminSocketId) {
						$('#chatMsg').attr('disabled', 'disabled');
						$('#chatSendButton').attr('disabled', 'disabled');
					}
		}

		addOnlineLabel = function() {
			if($('#onlineConfirm').length) return;
			$('#bakbakchat').width('150px');
			console.log('Adding online label');
			$('#onlineConfirm').unbind('click');
			$('#bakbakchat').empty();
			$('#bakbakchat').append("<p id='onlineConfirm' class='alert alert-success' style='margin:0px'>Support<img src='"+bakbakUrl+"img/avatars/avatar-green-talking20x20.png'></img></p>");
			$('#onlineConfirm').click(function(event) {
				showChatBar();
				event.preventDefault();
			});
		}


		addOfflineLabel = function() {
			if($('#offlineConfirm').length) return;
			$('#bakbakchat').width('150px');
			console.log('Adding offline label');
			$('#bakbakchat').empty();
			$('#offlineConfirm').unbind('click');
			$('#bakbakchat').append("<p id='offlineConfirm' class='alert alert-danger' style='margin:0px'>Support<img src='"+bakbakUrl+"img/avatars/avatar-red-talking20x20.png'></img></p>");
			$('#offlineConfirm').click(function(event) {
				showContactUsBar();
				event.preventDefault();
			});
		}

		this.onPresence = function (message) {
			console.log("Customer Id is " + self.customerId + " while sender is " + message.sender + " socketid is " + message.data.id);
			if(message.sender == self.customerId) {
				self.lastOnline = new Date().getTime();
				//console.log("Customer is online " + self.lastOnline);
				self.adminOnline = true;
				setAdminStatus(true);
				self.adminSocketId = message.data.id;
				heartbeat(self);
				createCookie('bakbakchatOnline','true',0,CUSTOMER_HEARTBEAT+5000);
				$('#chatMsg').removeAttr('disabled');
				}
		};
		this.onMessage = function (message) {
			console.log(message);
		};	

		this.onChat = function(message) {
			//console.log(message);
			addOnlineLabel();
			showChatBar(true);
			if(message.html) {
				addToChatMessageBoxHtml(null,self.visitorId,message.message);
			} else {
				addToChatMessageBox(null,message.sender,message.message);
			}
		};

		this.onCall = function(message) {
			console.log(message);
			self.call.onCall(message);
		};

		sendChatMessage = function(chatText) {
			if(chatText == null || chatText == '') return;
			socket.chat(chatText,self.adminSocketId);
			$('#chatMsg').val('');
			console.log('sending chat message to ' + self.adminSocketId +' with message ' + chatText);
			addToChatMessageBox(null,'me',chatText);
		}

		sendContactUsForm = function(data) {
			$('#contactUsButton').attr('disabled',true);
			html2canvas(document.body, {
  					onrendered: function(canvas) {
    					var imageDataUrl = canvas.toDataURL();
    					console.log(imageDataUrl);
    					console.log(data);
    					console.log(JSON.stringify(self));
    					toSend = JSON.parse(JSON.stringify(self));
    					toSend['email'] = 'biplav.saraf@gmail.com';
    					toSend['template'] = 'contactUs';
    					toSend['image'] = imageDataUrl;
    					toSend['contactUs'] = data;
    					$.post( bakbakUrl + "email",toSend,'json')
    						.done(function(response) {
    							console.log("Attempted to send email");
								if(response == "OK") {
									console.log('Email sent SUCCESS!');
									$('#contactUsForm').append("<p>Thanks for contacting us!</p>");
									$('#contactUsForm')[0].reset();
									$('#contactUsButton').removeAttr('disabled');
								} else {
									$('#contactUsForm').append("<p>Error Contacting the Server!</p>");
									$('#contactUsButton').removeAttr('disabled');
								}

							});
  					},
  					width: 900,
  					height: 900
			});
			
		}

		this.setCookie = function(data) {
			console.log('Got set cookie meesage!');
			createCookie(data.cookieName,data.cookieValue);
		} 
	};
	})();