const xAxis = new THREE.Vector3(1, 0, 0);
const yAxis = new THREE.Vector3(0, 1, 0); 

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();


    if (mixers && mixers.length > 0) {
        for (let i = 0; i < mixers.length; i++) {
            mixers[i].update(delta);
        }
    }

    if (isAutoSpinning && currentObjects.length > 0) {

        for (let i = 0; i < currentObjects.length; i++) {
            if (i === 0 || i === 1) {
    
                currentObjects[i].rotateOnWorldAxis(xAxis, 0.01);
            } else {
                currentObjects[i].rotateOnWorldAxis(yAxis, 0.01);
            }
        }
    }
    if (currentObjects && currentObjects.length > 0) {
        for (let i = 0; i < currentObjects.length; i++) {
            const obj = currentObjects[i];

            if (obj.userData.isParticles) {
                const positions = obj.geometry.attributes.position.array;
                const basePositions = obj.geometry.attributes.basePosition.array;
                const temp = window.physicsParams.temperature; 

                for (let j = 0; j < positions.length; j += 3) {
                    const bx = basePositions[j];
                    const by = basePositions[j+1];
                    const bz = basePositions[j+2];

                    positions[j]   = bx + Math.sin(time * 2 + by * 5) * 0.3 * temp;
                    positions[j+1] = by + Math.cos(time * 2 + bx * 5) * 0.3 * temp;
                    positions[j+2] = bz + Math.sin(time * 2 + bz * 5) * 0.3 * temp;
                }
                obj.geometry.attributes.position.needsUpdate = true;
            }

            if (obj.userData.isPancakeIce) {
                const amp = window.physicsParams.waveAmplitude;
                obj.children.forEach(ice => {
                    const x = ice.userData.baseX;
                    const z = ice.userData.baseZ;

                    ice.position.y = Math.sin(x * 3 + time * 3) * Math.cos(z * 3 + time * 3) * amp;
                    ice.rotation.x = Math.cos(x * 3 + time * 3) * amp * 0.8;
                    ice.rotation.z = -Math.sin(z * 3 + time * 3) * amp * 0.8;
                });
            }
            //Vortex Reconnection
            if (obj.userData.isVortexReconnection) {
                const positions = obj.geometry.attributes.position.array;
                const baseData = obj.geometry.attributes.baseData.array;
                
                const progress = (window.physicsParams.vortexTime - 0.5) / 3.5;

                const cycle = progress * (Math.PI * 2);
                const d = Math.cos(cycle);
                
                for (let j = 0; j < positions.length; j += 3) {
                    const theta = baseData[j];
                    const index = baseData[j+1];
                    const count = positions.length / 3;
                    
                    let x, y, z;
                    
                    //Singularity process => saperate into 2 rings when d > 0 & combined into 1 when d <= 0
                    if (d > 0) {
                        //before hitting => 2 rings
                        const isRightRing = index > count / 2;
                        const ringOffset = isRightRing ? d : -d;
                        const localTheta = theta * 2; 
                        
                        x = ringOffset + Math.cos(localTheta) * 0.5;
                        y = Math.sin(localTheta) * 0.5;
                        //tilt the rings together 
                        z = isRightRing ? Math.cos(localTheta) * 0.5 : -Math.cos(localTheta) * 0.5;
                    } else {
                        const spread = -d; 
                        x = Math.cos(theta) * (0.5 + spread * 0.5);
                        y = Math.sin(theta) * 0.5;
                        z = Math.sin(theta * 4) * 0.2 * spread; 
                    }
                    
                    positions[j]   = x;
                    positions[j+1] = y;
                    positions[j+2] = z;
                }
                obj.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
    
    if (window.liveCanvasTexture) {
    window.liveCanvasTexture.needsUpdate = true;
}
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}