// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDd-nWCxF7FU_96n3fq-d_8dD5Tsg6goCE",
  authDomain: "safezone-b4b32.firebaseapp.com",
  projectId: "safezone-b4b32",
  storageBucket: "safezone-b4b32.appspot.com",
  messagingSenderId: "801084165474",
  appId: "1:801084165474:web:b2b566071b7c770170703b",
  measurementId: "G-BR62WF6VXB"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  // Check if Firebase is already initialized
  if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
    
    // Enable functions emulator if in development
    if (window.location.hostname === 'localhost') {
      firebase.functions().useEmulator('localhost', 5001);
    }
  }
}

export default firebaseConfig;

