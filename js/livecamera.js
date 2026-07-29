window.liveCanvasTexture = null;

function startLiveCameraHologram() {
    isAutoSpinning = false; 
    const video = document.getElementById('webcam-video');
    const outputCanvas = document.getElementById('opencv-output');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video: true})
            .then(function(stream) {
                
                video.onloadeddata = () => {
                    console.log("webcame startes");
                    
                    opencv_live(video);

                    window.liveCanvasTexture = new THREE.CanvasTexture(outputCanvas);
                    window.liveCanvasTexture.minFilter = THREE.LinearFilter;
                    
                    const geometry = new THREE.PlaneGeometry(4, 3); 
                    const material = new THREE.MeshBasicMaterial({ 
                        map: window.liveCanvasTexture, 
                        side: THREE.DoubleSide,
                        transparent: true  
                    });
                    
                    const baseModel = new THREE.Mesh(geometry, material);

                    Hologram_Clipping(baseModel);
                    
                    console.log("Successfully loaded OpenCV Hologram");
                }; 

                video.srcObject = stream;
                video.play();

            })
            .catch(function(error) {
                console.error("camera error:", error);
                alert("camera error");
            });
    }
}