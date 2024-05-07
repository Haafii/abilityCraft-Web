import React, { useState, useEffect } from 'react';
import ObjectImages from '../src/assets/Objects/ObjectImages';
import { ref, onValue } from "firebase/database";
import { getKeyById } from '../public/constants/ObjectId';
import { db } from '../config';
import axios from 'axios';
import queryString from 'query-string';


const Speaking = () => {
  const [randomImage, setRandomImage] = useState(null);
  const [showMicrophone, setShowMicrophone] = useState(false);
  const [imageName, setImageName] = useState(null);
  const [currentObject, setCurrentObject] = useState('abc');
  const [wrongPlacement, setWrongPlacement] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [wrongTranscript, setWrongTranscript] = useState(0);
  const [score, setScore] = useState(0);
  const [username, setUsername] = useState(null);
  const max_wrong_pic = 10;
  const max_wrong_speech = 10;
  useEffect(() => {
    const queryParams = queryString.parse(window.location.search);
    const data = queryParams.data;
    if (data && data !== username) {
      setUsername(data);
    }
  }, [])
  // console.log(username);

  useEffect(() => {
    const getRandomImage = () => {
      const imagesArray = ObjectImages;
      const randomIndex = Math.floor(Math.random() * imagesArray.length);
      return imagesArray[randomIndex];
    };

    const randomImage = getRandomImage();
    setRandomImage(randomImage.source);
    setImageName(randomImage.key);
    const startCountRef = ref(db, 'rfid/');
    onValue(startCountRef, (snapshot) => {
      const data = snapshot.val();
      const placedObject = getKeyById(data.cardUID);
      console.log(placedObject)
      setCurrentObject(placedObject);
      if (placedObject === randomImage.key) {
        setCorrect(true);
      } else {
        setWrongPlacement((prevCount) => prevCount + 1);
      }
    });
  }, []);

  useEffect(() => {
    if (correct) {
      setShowMicrophone(true);
    }
  }, [correct]);

  const startRecording = () => {
    setRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    setRecording(false);
    recognition.stop();
  };

  const recognition = new window.webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.onresult = (event) => {
    const speechToText = event.results[0][0].transcript;
    setTranscript(speechToText);
    checkTranscript(speechToText); // Call function to check transcript
    stopRecording();
  };

  const calculateScore = async () => {
    const wrong = (wrongPlacement - 1);
    const current_score = 9 - 2 * ((wrong / max_wrong_pic) + (wrongTranscript / max_wrong_speech)) + 1;
    setScore(9 - 2 * ((wrong / max_wrong_pic) + (wrongTranscript / max_wrong_speech)) + 1)
    setGameEnded(true);
    try {
      // const response = await axios.post(`${process.env.API_HOST}/user/login`, {
      const response = await axios.post('http://localhost:8500/games/speechtraining', {
        username: username,
        attemptForPicture: wrong.toString(),
        attemptForSpeech: wrongTranscript.toString(),
        score: current_score.toString(),
      });
      console.log("first")
      console.log(response.data);
    } catch (error) {
      console.log('Error', error.response.data.message);
    }
  }

  console.log({ score })

  const checkTranscript = (spokenText) => {
    if (spokenText.toLowerCase() === imageName.toLowerCase()) {
      calculateScore()
    } else {
      setWrongTranscript((prevCount) => prevCount + 1); // Increment wrong transcript count
    }
  };

  if (gameEnded) {
    return (
      <div className="bg-gray-300 text-xl flex flex-col justify-center items-center h-screen">
        <p>Attempts for picture: {(wrongPlacement - 1)}</p>
        <p>Attempts for speech: {wrongTranscript}</p>
        <p>Score: {score}</p>
      </div>
    );
  }


  return (
    <div className="bg-gray-300 h-screen flex flex-col justify-center items-center">
      <p className="text-lg font-semibold text-gray-800">Wrong attempts for picture: {(wrongPlacement - 1)}</p>
      {wrongTranscript > -1 && showMicrophone && (
        <p className="text-lg font-semibold text-gray-800">Wrong attempts for speech: {wrongTranscript}</p>
      )}
      {randomImage && (
        <>
          <div className="items-center justify-center">
            <img src={randomImage} alt="Random" style={{ width: 300, height: 300, objectFit: 'contain', marginBottom: 10 }} />
          </div>
          {correct ? <p className="text-2xl font-bold text-gray-800">Speak</p> : <p className="text-2xl font-bold text-gray-800">Place the correct object</p>}
        </>
      )}
      {showMicrophone && (
        <div className="mt-8">
          <button onClick={recording ? stopRecording : startRecording} className="bg-blue-500 px-4 py-2 rounded text-white">
            {recording ? '🛑' : '🎤'}
          </button>
        </div>
      )}
      {transcript && (
        <div>
          <p className="text-lg font-semibold text-gray-800">You said is : {transcript}</p>
          <p className="text-lg text-gray-800"></p>
        </div>
      )}
    </div>
  );
};

export default Speaking;




