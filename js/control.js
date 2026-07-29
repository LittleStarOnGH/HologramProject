let guestPeer; 
let connection;

const peerOptions = {
    secure: true,
    port: 443,
    config: {
        'iceServers': [
    
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            
            {
                urls: 'turn:global.relay.metered.ca:80', //need to click show ICE server array 
                username: 'f00ca1a8bd1987f3d08accd9', //the metered turn server username 
                credential: '9tc8dBz1j+1ywwJI' //password
            }
        ]
    }
};

function Connect_Screen() {

    const roomCode = document.getElementById("room-code-input").value.trim();
    
    if (!roomCode) {
        alert("Please enter the 4-digit room code first!");
        return;
    }
    
    guestPeer = new Peer(peerOptions);


    guestPeer.on("open", function () {
        const peerID = "UEA" + roomCode;
        connection = guestPeer.connect(peerID); 
        
        connection.on("open", function () {
            
            document.getElementById('mode').classList.add('hidden');
            document.getElementById('controller-view').classList.remove('hidden');
            
            setupTouchpad("touchpad", "rotateTouchpad");
            setupTouchpad("touchpad-2", "rotateTouchpad-2"); 
        });

        connection.on("error", function(err) {
            alert("Failed to connect.");
        });
    });
}

function setupTouchpad(elementId, actionName) {
    const touchpad = document.getElementById(elementId);
    if (!touchpad) {
        return;
    }

    let isDragging = false;
    let previousX = 0;
    let previousY = 0;

    const handleMovement = (currentX, currentY) => {
        let deltaX = currentX - previousX;
        let deltaY = currentY - previousY;
        previousX = currentX;
        previousY = currentY;

        if (connection && connection.open) {
            connection.send({ 
                action: actionName, 
                valueX: deltaX * 0.1,
                valueY: deltaY * 0.1
            });
        }
    };

    touchpad.addEventListener("touchstart", (event) => {
        isDragging = true;
        previousX = event.touches[0].clientX;
        previousY = event.touches[0].clientY;
    }, { passive: false });

    touchpad.addEventListener("touchmove", function(e) {
        if (!isDragging) return;
        e.preventDefault(); 
        handleMovement(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive: false});

    touchpad.addEventListener("touchend", function() { isDragging = false; });

    //computer touchpad
    touchpad.addEventListener("mousedown", function(e) {
        isDragging = true;
        previousX = e.clientX;
        previousY = e.clientY;
    });
    touchpad.addEventListener("mousemove", function(e) {
        if (!isDragging) return;
        handleMovement(e.clientX,e.clientY);
    });
    touchpad.addEventListener("mouseup", function() { isDragging = false; });
    touchpad.addEventListener("mouseleave", function() { isDragging = false; });
}

function Command(actionName, value) {

    if (connection && connection.open){
        connection.send({action: actionName, value:parseFloat(value)})
    }
}

function Select_Model(modelName) {
    if (connection && connection.open) {
        const command = {
            action: "changeModel",
            value: modelName};
        connection.send(command);
        
        const scaleLabel = document.getElementById("slider-label-scale");
        const currentLang = localStorage.getItem('myAppLanguage') || 'en';
        if (scaleLabel) {
            if (modelName === "Particles") {
                scaleLabel.innerText = change_lang[currentLang]["dyn_temperature"];
            } else if (modelName === "PancakeIce") {
                scaleLabel.innerText = change_lang[currentLang]["dyn_wave"];
            } else if (modelName === "VortexReconnection") {
                scaleLabel.innerText = change_lang[currentLang]["dyn_evolution"];
            } else {
                scaleLabel.innerText = change_lang[currentLang]["adj_size"];
            }
        }
        
        setTimeout(Connect_Sliders, 0); 
    } else {
        alert("Remote disconnected. Please connect again.");
    }
}

function Change_Colour(hexcolor) {
    if (connection && connection.open) {
        connection.send({ action: "changecolor", value: hexcolor });
    }
}

function Toggle_Code_Box() {
    if (connection && connection.open) {
        connection.send({ action: "toggleCodeBox" });
    }
}

function Toggle_Lines() {
    if (connection && connection.open) {
        connection.send({ action: "toggleLines" });
    }
}

function Toggle_Guest_Box() {
    document.getElementById("guest-code-box").classList.toggle("hidden");
}

function Toggle_Lang_Menu() {
    if (connection && connection.open) {
        connection.send({ action: "toggleLangMenu" });
    }
}

function Toggle_Colour_Picker() {
    const modal = document.getElementById('color-picker-modal');
    if (modal) {
        modal.classList.toggle('hidden');
    }
}


document.addEventListener("DOMContentLoaded", function() {
    const colorContainer = document.getElementById("color-wheel-container");
    
    if (colorContainer && typeof iro !== 'undefined') {
        
        var colorPicker = new iro.ColorPicker(colorContainer, {
            width: 220, 
            color: "#00ffcc", 
            borderWidth: 2,
            borderColor: "#ffffff",
            layout: [
                { 
                    component: iro.ui.Wheel,
                },
                { 
                    component: iro.ui.Slider, 
                    options: { sliderType: 'value' }
                }
            ]
        });

        colorPicker.on('color:change', function(color) {
            Change_Colour(color.hexString);
        });
    }
});

function Connect_Sliders() {
    Command('updateScale', document.getElementById('scale-slider').value);
    Command('updateOffsetLR', document.getElementById('offset-slider-lr').value);
    Command('updateOffsetTop', document.getElementById('offset-slider-bottom').value);
    Command('updateSideY', document.getElementById('side-y-slider').value);
}

    const threeContainer = document.getElementById("screen-view"); 
    const opencvContainer = document.getElementById("opencv-screen-view"); 
    
    if (mode === 'threejs') {
        threeContainer.classList.remove('hidden');
        opencvContainer.classList.add('hidden');
        isAutoSpinning = true;
                
        stopOpenCVLiveProcessing()
        
        if (typeof scene === 'undefined' || !scene) { init(); } 
        
    } else if (mode === 'opencv') {
        threeContainer.classList.add('hidden');
        opencvContainer.classList.remove('hidden');
        isAutoSpinning = false;
        
         
        opencv_live(document.getElementById('webcam-video'))
    }