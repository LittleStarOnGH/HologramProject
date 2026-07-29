let liveCap, liveFrame, hsvFrame, mask, liveResult;
let lowBound, highBound;
let isLive = false;

function opencv_live(videoElement) {

    if (typeof cv=== 'undefined' || !cv.Mat){
        alert("OpenCV is still loading, please wait for a second.")
        return;
    }   
    const outputCanvas = document.getElementById('opencv-output');
    
    videoElement.width = videoElement.videoWidth || 640;
    videoElement.height = videoElement.videoHeight || 480;
    outputCanvas.width = videoElement.width;
    outputCanvas.height = videoElement.height;

    if (!liveCap) {
        liveCap = new cv.VideoCapture(videoElement);
        liveFrame = new cv.Mat(outputCanvas.height, outputCanvas.width, cv.CV_8UC4);
        hsvFrame = new cv.Mat(outputCanvas.height, outputCanvas.width, cv.CV_8UC3); // HSV
        mask = new cv.Mat(outputCanvas.height, outputCanvas.width, cv.CV_8UC1);      //Black&White
        liveResult = new cv.Mat(outputCanvas.height, outputCanvas.width, cv.CV_8UC4); //Transparent
    }

    isLive = true;
    processLiveVideo();
}

function processLiveVideo() {
    if (!isLive) return;

    try {
        liveCap.read(liveFrame);
        
        //Convert from RGBA to RGB, then convert to HSV (Detecting the green color)
        cv.cvtColor(liveFrame, hsvFrame, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsvFrame, hsvFrame, cv.COLOR_RGB2HSV);

        //HSV Range - green shade
        lowBound = new cv.Mat(hsvFrame.rows, hsvFrame.cols, hsvFrame.type(), [35, 40, 20, 0]);

        highBound = new cv.Mat(hsvFrame.rows, hsvFrame.cols, hsvFrame.type(), [85, 255, 255, 0]);

        //convert the in range green shade into white
        //Non-green = Black.
        cv.inRange(hsvFrame, lowBound, highBound, mask);
        
        //then invert Green = Black. Non-green = White.
        cv.bitwise_not(mask, mask);

    
        //create a transparent frame
        liveResult.setTo(new cv.Scalar(0, 0, 0, 0));

        //.copyTo -> copies the original colour of white mask from liveFrame and paste into liveResult
        liveFrame.copyTo(liveResult, mask);

        //send to canvas
        cv.imshow('opencv-output', liveResult);
        
        //clear cache
        lowBound.delete();
        highBound.delete();
        
        requestAnimationFrame(processLiveVideo);

    } catch (err) {
        console.error("OpenCV Chroma Key Error: ", err);
        isLive = false;
    }
}

function stopOpenCVLiveProcessing() {
    isLive = false;
}