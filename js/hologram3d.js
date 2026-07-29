let peer;
let scene;
let camera;
let line_left, line_right, line_top, line_bottom, line_centre_left, line_centre_right;
let isHelperVisible = false; 
let renderer;
let objects;
let hologramGroup; 
let currentObjects = [];
let mixers = [];
let clock = new THREE.Clock();
let isAutoSpinning = false;

const modelLibrary = {
    "doorlock": "./models/doorlock.glb",
    "artifact": "./models/artifact.glb",
    "dragon": "./models/dragon.glb",
    "astronaut": "./models/astronaut.glb"
};

window.physicsParams = { temperature: 0.5, waveAmplitude: 0.5, vortexTime: 0.5 };

let currentModel = "Cube"; 
const angles = [1,2,3]; //it's actually not an angle it's just a position of each objects clone but idk what to name this :(

const loader = new THREE.GLTFLoader();

function init() {
    const container = document.getElementById("hologram-container");
    if (!container) return;

    container.innerHTML = ''; // clear the old content

  
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);

    renderer.localClippingEnabled = true; 

    //renderer.setClearColor(color code Hexadecimal, opacity 0-1);
    renderer.setClearColor(0x000000, 1);
    renderer.outputEncoding = THREE.sRGBEncoding; 
    renderer.toneMapping = THREE.ACESFilmicToneMapping; 
    renderer.toneMappingExposure = 0.6; 

    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    camera.position.set(0, 0, 20); 
    camera.lookAt(0, 0, 0);

   
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);

    hologramGroup = new THREE.Group();
    scene.add(hologramGroup);
    
    Load_Model(currentModel);
    animate(); 
}

function Display_Screen() {   
    document.getElementById('mode').classList.add('hidden');
    
    document.getElementById('screen-view').classList.remove('hidden');
    
    init(); 
    Start_Screen(); 
}

function Start_Screen() {
    const roomCode = Math.floor(1000 + Math.random() * 9000).toString(); // Generate a random 4-digit room code
    const hostPeerID = "UEA"+ roomCode;


    peer = new Peer(hostPeerID, peerOptions);
    peer.on('open', function (id) {
        console.log("Code: " + roomCode);
        
        document.getElementById("hologram-room-number").innerText =roomCode;
    });    

    peer.on('connection', function (conn) {
        console.log("Guest connected with ID: " + conn.peer);
        conn.on('data', function (data) {


            if (data.action === "changeModel") {
                currentModel = data.value;
                Load_Model(data.value);
            }
            
            else if (data.action === "rotateTouchpad") {
                if (hologramGroup) {
                    hologramGroup.rotation.z += data.valueX;
                }
            }
            else if (data.action === "rotateTouchpad-2") {
                const xAxis = new THREE.Vector3(1, 0, 0); 
                const yAxis = new THREE.Vector3(0, 1, 0); 

                if (currentObjects && currentObjects.length > 0) {
                    for (let i = 0; i < currentObjects.length; i++) {
                        currentObjects[i].rotateOnWorldAxis(yAxis, data.valueX * 0.5);
                        currentObjects[i].rotateOnWorldAxis(xAxis, data.valueY * 0.5);
                    } 
                }
            }
                        
            else if (data.action === "updateOffsetLR") {
                if (currentObjects && currentObjects.length === 3) {
                    currentObjects[0].position.x = -data.value; 
                    currentObjects[1].position.x = data.value;  
                }
            }
            
            //middle one (top-bottom)
            else if (data.action === "updateOffsetTop") {
                if (currentObjects && currentObjects.length === 3) {
                    currentObjects[2].position.y = data.value; 
                }
            }

            else if (data.action === "updateScale") {
                if (currentModel === "Particles"){
                    window.physicsParams.temperature = (data.value - 0.5) / 3.5;

            } else if (currentModel === "PancakeIce") {
                window.physicsParams.waveAmplitude = (data.value - 0.5) / 3.5;
                
            } else if (currentModel === "VortexReconnection") {
                window.physicsParams.vortexTime = data.value;

            } else {
                //regular models
                if (currentObjects && currentObjects.length > 0) {
                    for (let i = 0; i < currentObjects.length; i++) {
                        const multiplier = data.value / 2.0;
                        const base = currentObjects[i].userData.baseScale || 1;
                        const finalScale = base * multiplier;
                        currentObjects[i].scale.set(finalScale, finalScale, finalScale);
                    }
                }
            }
        }   
            else if (data.action === "updateSideY") {
                if (currentObjects && currentObjects.length === 3) {
                    currentObjects[0].position.y = data.value;
                    currentObjects[1].position.y = data.value;
                }
            }
            
            else if (data.action === "toggleLangMenu") {
                const langMenu = document.getElementById('lang-menu');
                if (langMenu) {
                    langMenu.classList.toggle('hidden');
                }
}
           
            else if (data.action === "changecolor") {
                if (currentObjects && currentObjects.length > 0) {
                    for (let i = 0; i < currentObjects.length; i++) {

                        //basic geometric shapes that has the material already
                        if ((currentObjects[i].isMesh || currentObjects[i].isLine || currentObjects[i].isPoints) && currentObjects[i].material) {
                            currentObjects[i].material.color.set(data.value);
                        } 
                        
                        //multi gltf file type
                        else {
                            currentObjects[i].traverse((child) => {
                                if ((child.isMesh || child.isLine || child.isPoints) && child.material && child.material.color) {
                                    child.material.color.set(data.value);
                                }
                            });
                        }
                    }
                }
            }

            else if (data.action === "toggleCodeBox") {
                const codeBox = document.getElementById("room-code-display-box");
                if (codeBox) {
                    if (codeBox.style.display === "none") {
                        codeBox.style.display = "block";
                    } else {
                        codeBox.style.display = "none";
                    }
                }
            }
            else if (data.action === "toggleLines") {
                isHelperVisible = !isHelperVisible; 
                
                if (line_left) line_left.visible = isHelperVisible;
                if (line_right) line_right.visible = isHelperVisible;
                if (line_top) line_top.visible = isHelperVisible;
                if (line_bottom) line_bottom.visible = isHelperVisible;
                if (line_centre_right) line_centre_right.visible = isHelperVisible;
                if (line_centre_left) line_centre_left.visible = isHelperVisible;
            }
            
        });
    });
}


function Hologram_Clipping(baseModel) {
    //THREE.Vector3(x, y, z)

    const plane_left = new THREE.Plane(new THREE.Vector3(-1,0,0),-9);
    const plane_right = new THREE.Plane(new THREE.Vector3 (1,0,0),-9);
    const plane_top = new THREE.Plane(new THREE.Vector3(0,1,0),0);
    const plane_bottom = new THREE.Plane(new THREE.Vector3(0,-1,0),0);

    const plane_centre_left = new THREE.Plane(new THREE.Vector3 (1,0,0),4);
    const plane_centre_right = new THREE.Plane(new THREE.Vector3 (-1,0,0),4);

    
    if (line_left) scene.remove(line_left);
    if (line_right) scene.remove(line_right);
    if (line_top) scene.remove(line_top);
    if (line_bottom) scene.remove(line_bottom);
    if (line_centre_left) scene.remove(line_centre_left);
    if (line_centre_right) scene.remove(line_centre_right);

    line_left = new THREE.PlaneHelper(plane_left, 10, 0xff0000); 
    line_right = new THREE.PlaneHelper(plane_right, 10, 0xff0000); 
    line_top = new THREE.PlaneHelper(plane_top, 10, 0xff0000); 
    line_bottom = new THREE.PlaneHelper(plane_bottom, 10, 0xff0000); 
    line_centre_right = new THREE.PlaneHelper(plane_centre_right, 10, 0xff0000); 
    line_centre_left = new THREE.PlaneHelper(plane_centre_left, 10, 0xff0000); 

    scene.add(line_left);
    scene.add(line_right);
    scene.add(line_top);
    scene.add(line_bottom);
    scene.add(line_centre_right);
    scene.add(line_centre_left);

    const offsetX = 11.5; 
    const offsetY = 3.0; 
    const offsetSideY = -3.0;

    for (let i = 0; i < angles.length; i++) {
        let modelClone;
        if (typeof THREE.SkeletonUtils !== 'undefined') {
            modelClone = THREE.SkeletonUtils.clone(baseModel);
        } else {
            modelClone = baseModel.clone(); 
        }
        
        let currentClips = []; 

        if (i === 0) { // left one
            modelClone.position.x = -offsetX;
            modelClone.position.y = offsetSideY; 
            modelClone.rotation.z = THREE.MathUtils.degToRad(-90);
            currentClips = [plane_left,plane_bottom];
            
        } else if (i === 1) { // right one
            modelClone.position.x = offsetX;
            modelClone.position.y = offsetSideY; 
            modelClone.rotation.z = THREE.MathUtils.degToRad(90);
            currentClips = [plane_right,plane_bottom]; //when i include plane_bottom, the side ones are gone when moving to the top.

        } else if (i === 2) { // middle one
            modelClone.position.x = 0; 
            modelClone.position.y = offsetY;
            modelClone.rotation.z = THREE.MathUtils.degToRad(180);
           currentClips = [plane_centre_left, plane_centre_right];
        }

        modelClone.traverse((child) => {
            if ((child.isMesh || child.isLine || child.isPoints) && child.material) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(mat => {
                        const newMat = mat.clone();
                        newMat.clippingPlanes = currentClips;
                        newMat.clipShadows = true;
                        return newMat;
                    });
                } else {
                    child.material = child.material.clone();
                    child.material.clippingPlanes = currentClips;
                    child.material.clipShadows = true;
                }
            }
        });

        hologramGroup.add(modelClone);
        modelClone.userData.baseScale = modelClone.scale.x;
        currentObjects.push(modelClone);
    }
}
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    const container = document.getElementById("hologram-container");
    if (!container || !camera || !renderer) 
    return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix(); 
    renderer.setSize(container.clientWidth, container.clientHeight);
}