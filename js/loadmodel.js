function Load_Model(modelName) {

    const geometricShapes = [
    "Cube", "Torus", "TrefoilKnot", "FigureEightPolynomialKnot", 
    "NewShape", "CinquefoilKnot", "GrannyKnot", "Dodecahedron", 
    "Octahedron", "HeartCurve", "VivianiCurve", "Icosahedron", 
    "ComplexKnot", "DNAPair", "KleinBottle", "ThreeTorus", "ApollonianGasket", 
    "EggTray", "Particles","PancakeIce", "VortexReconnection"];
    
    const checkGeometricShape = geometricShapes.includes(modelName);

    const checkLiveCam = (modelName === "LiveCamera"); 
    
    if (!checkGeometricShape && !checkLiveCam && !modelLibrary[modelName]) {
        console.error("model name not found:", modelName);
        return;
    }

    currentObjects = []; 
    mixers = [];
    
    if (hologramGroup) {
        while(hologramGroup.children.length > 0){ 
            
            hologramGroup.children[0].traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else child.material.dispose();
                    }
                }
            });
            hologramGroup.remove(hologramGroup.children[0]);
        }
        hologramGroup.rotation.set(0, 0, 0); 
    }
    
    if (checkGeometricShape) {
        GeometricShape(modelName);
        return;
    }

    if (checkLiveCam) {
        startLiveCameraHologram();
        return;
    }
    const modelUrl = modelLibrary[modelName];

    loader.load(modelUrl, function (gltf) {
        const baseModel = gltf.scene;
        
        baseModel.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false; 

                if (modelName === "dragon" && child.material) {
                    const originalTexture = child.material.map; 
                    
                    //  MeshStandardMaterial -> MeshBasicMaterial
                    child.material = new THREE.MeshBasicMaterial({
                        map: originalTexture, 
                        side: THREE.DoubleSide, 
                        skinning: true
                    });
                
                }
            }
        });
        
        //dragon code stuff 
        baseModel.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(baseModel);
        const size = new THREE.Vector3();
        box.getSize(size); 

        let maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 2.0; 

        let automaticScale;

        if (modelName === "dragon") {
            automaticScale = 0.5; 
        } else {
            if (maxDim < 0.001) {
                console.warn("Detected missing dimensions. Applying standard scale.");
                maxDim = 1.0; 
            }
            automaticScale = targetSize / maxDim;
        }
        
        baseModel.scale.set(automaticScale, automaticScale, automaticScale);

        
        Hologram_Clipping(baseModel);
            
           if (gltf.animations && gltf.animations.length > 0) {
                console.log("all dragons animation:", gltf.animations);
                const animationIndex = 0;

                currentObjects.forEach((obj) => {
                    const mixer = new THREE.AnimationMixer(obj.children[0] || obj);
                    if (gltf.animations[animationIndex]) {
                        const action = mixer.clipAction(gltf.animations[animationIndex]);
                        action.play();
                    }
                    mixers.push(mixer);
            });
}
        
        console.log("Successfully loaded 3 sides of " + modelName);
        
    }, 
    undefined, 
    function (error) {
        console.error("cant load the glb file", error);
    });
}