// 0. Install fingerpose npm install fingerpose
// 1. Add Use State
// 2. Import emojis and finger pose import * as fp from "fingerpose";
// 3. Setup hook and emoji object
// 4. Update detect function for gesture handling
// 5. Add emoji display to the screen

///////// NEW STUFF ADDED USE STATE
import React, { useRef, useState, useEffect } from "react";
///////// NEW STUFF ADDED USE STATE

// import logo from './logo.svg';
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam";
import "./App.css";
import { drawHand } from "./utilities";

///////// NEW STUFF IMPORTS
import * as fp from "fingerpose";
import victory from "./victory.png";
import thumbs_up from "./thumbs_up.png";
///////// NEW STUFF IMPORTS

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  ///////// NEW STUFF ADDED STATE HOOK
  const [emoji, setEmoji] = useState(null);
  const images = { thumbs_up: thumbs_up, victory: victory };
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [showStream, setShowStream] = useState(true);
  const [videoBlob, setVideoBlob] = useState();
  ///////// NEW STUFF ADDED STATE HOOK

  const runHandpose = async () => {
    const net = await handpose.load();
    console.log("Handpose model loaded.");
    //  Loop and detect hands
    setInterval(() => {
      detect(net);
    }, 10);
  };

  const detect = async (net) => {
    try {
      // Check data is available
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        // Get Video Properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // Set canvas height and width
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        // Make Detections
        const hand = await net.estimateHands(video);
        // console.log("hand", hand);

        ///////// NEW STUFF ADDED GESTURE HANDLING

        if (hand.length > 0) {
          const GE = new fp.GestureEstimator([
            fp.Gestures.VictoryGesture,
            fp.Gestures.ThumbsUpGesture,
          ]);
          const gesture = await GE.estimate(hand[0].landmarks, 4);
          if (gesture.gestures !== undefined && gesture.gestures.length > 0) {
            console.log("gestures", gesture.gestures);

            const confidence = gesture.gestures.map(
              (prediction) => prediction.confidence
            );
            const maxConfidence = confidence.indexOf(
              Math.max.apply(null, confidence)
            );
            if (gesture?.gestures[maxConfidence]?.confidence) {
              console.log(
                "gesture name and max confidence",
                gesture?.gestures[maxConfidence]?.name,
                gesture?.gestures[maxConfidence]?.confidence
              );
              let finalGestureName = gesture?.gestures[maxConfidence]?.name;
              let finalGestureConfidence =
                gesture?.gestures[maxConfidence]?.confidence;
              if (
                finalGestureName === "thumbs_up" &&
                finalGestureConfidence >= 8
              ) {
                handleStartCaptureClick();
              } else if (
                finalGestureName === "victory" &&
                finalGestureConfidence >= 8
              ) {
                handleStopCaptureClick();
              }
            }
            setEmoji(gesture.gestures[maxConfidence].name);
            console.log("emoji", emoji);
          }
        }

        ///////// NEW STUFF ADDED GESTURE HANDLING

        // Draw mesh
        const ctx = canvasRef.current.getContext("2d");
        drawHand(hand, ctx);
      }
    } catch (error) {
      console.log("error in detection function", error);
    }
  };

  useEffect(() => {
    runHandpose();
  }, []);

  const handleStartCaptureClick = React.useCallback(() => {
    setCapturing(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
    setRecordedChunks([]);
  }, [webcamRef, setCapturing, mediaRecorderRef]);

  const handleDataAvailable = React.useCallback(
    ({ data }) => {
      if (data.size > 0) {
        console.log("dataa on handleDataAvailable", data);
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStopCaptureClick = React.useCallback(() => {
    setCapturing(false);
    mediaRecorderRef.current.stop();
    // setShowStream(false);
    setEmoji(null);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  const handleDownload = React.useCallback(() => {
    console.log(recordedChunks);
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: "video/mp4",
      });
      const url = URL.createObjectURL(blob);
      console.log("url of recorded blob", url);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = url;
      a.download = "react-webcam-stream-capture.mp4";
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  const handlePreview = async () => {
    console.log("enter in handle preview", recordedChunks);
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: "video/mp4",
      });
      const url = URL.createObjectURL(blob);
      console.log("url of recorded blob", url);
      setVideoBlob(url);
      setShowStream(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {showStream ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zindex: 9,
                width: 740,
                height: 600,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zindex: 9,
                width: 640,
                height: 480,
              }}
            />
            {/* NEW STUFF */}
            {emoji !== null ? (
              <imgsetVideoBlob
                src={images[setVideoBlob]}
                style={{
                  position: "absolute",
                  marginLeft: "auto",
                  marginRight: "auto",
                  left: 400,
                  bottom: 500,
                  right: 0,
                  textAlign: "center",
                  height: 100,
                }}
              />
            ) : (
              ""
            )}

            {/* NEW STUFF */}
            {capturing ? (
              <button
                style={{
                  position: "absolute",
                  marginLeft: "auto",
                  marginRight: "auto",
                  bottom: 10,
                  textAlign: "center",
                  height: "auto",
                }}
                onClick={handleStopCaptureClick}
              >
                Stop Capture
              </button>
            ) : (
              <button
                style={{
                  position: "absolute",
                  marginLeft: "auto",
                  marginRight: "auto",
                  textAlign: "center",
                  bottom: 10,
                  height: "auto",
                }}
                onClick={handleStartCaptureClick}
              >
                Start Capture
              </button>
            )}
            {recordedChunks?.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: "60%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignContent: "center",
                  alignItems: "center",
                  padding: "10px",
                }}
              >
                <button
                  style={{
                    // position: "absolute",
                    marginLeft: "auto",
                    marginRight: "auto",
                    bottom: 10,
                    textAlign: "center",
                    height: "auto",
                    left: 260,
                  }}
                  onClick={handleDownload}
                >
                  Download
                </button>
                <button
                  style={{
                    // position: "absolute",
                    marginLeft: "auto",
                    marginRight: "auto",
                    bottom: 10,
                    textAlign: "center",
                    height: "auto",
                    right: 260,
                  }}
                  onClick={handlePreview}
                >
                  Preview
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <video controls preload="metadata" width={640} height={480}>
              {console.log("videoBlob", videoBlob)}
              <source
                src={videoBlob}
                // src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                // type="video/mp4"
              />
            </video>
            <div
              style={{
                width: "60%",
                display: "flex",
                justifyContent: "space-between",
                alignContent: "center",
                alignItems: "center",
                padding: "10px",
              }}
            >
              <button
                style={{
                  marginLeft: "auto",
                  marginRight: "auto",
                  textAlign: "center",
                  bottom: 10,
                  height: "auto",
                }}
                onClick={() => {
                  console.log("clicked retake", showStream);
                  setShowStream(true);
                  setRecordedChunks([]);
                }}
              >
                Retake Video
              </button>
              {recordedChunks.length > 0 && (
                <button
                  style={{
                    marginLeft: "auto",
                    marginRight: "auto",
                    bottom: 10,
                    textAlign: "center",
                    height: "auto",
                    right: 20,
                  }}
                  onClick={handleDownload}
                >
                  Download
                </button>
              )}
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
