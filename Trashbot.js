// URL del modelo y los metadatos proporcionados por Teachable Machine
const imageURL = "https://teachablemachine.withgoogle.com/models/wLnBIqF8F/";
let imageModel, webcam, imageLabelContainer, maxImagePredictions;
let ws;  // Variable para WebSocket

// Inicialización de WebSocket
function initWebSocket() {
    ws = new WebSocket('ws://192.168.0.14:81');  // Reemplaza con la IP de tu ESP32
    ws.onopen = function() {
        console.log('Conexión WebSocket establecida');
    };
    ws.onmessage = function(event) {
        console.log('Mensaje del ESP32:', event.data);
    };
    ws.onerror = function(error) {
        console.log('Error en WebSocket:', error);
    };
    ws.onclose = function() {
        console.log('Conexión WebSocket cerrada');
    };
}

// Función para inicializar el reconocimiento de imágenes
async function initImageRecognition() {
    const modelURL = imageURL + "model.json";
    const metadataURL = imageURL + "metadata.json";

    imageModel = await tmImage.load(modelURL, metadataURL);
    maxImagePredictions = imageModel.getTotalClasses();

    const flip = true;
    webcam = new tmImage.Webcam(400, 400, flip);    
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(imageLoop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);

    imageLabelContainer = document.getElementById("image-label-container");
    for (let i = 0; i < maxImagePredictions; i++) {
        imageLabelContainer.appendChild(document.createElement("div"));
    }
}

// Actualización continua para realizar predicciones
async function imageLoop() {
    webcam.update();
    await predictImage();
    window.requestAnimationFrame(imageLoop);
}

let previousPredictionState = [];

async function predictImage() {
    const prediction = await imageModel.predict(webcam.canvas);
    let newPredictionState = [];

    for (let i = 0; i < maxImagePredictions; i++) {
        let className = "";
        let sendSignal = "";

        // Asignar clases y comandos correspondientes
        switch (i) {
            case 0: className = "Plástico"; sendSignal = "A"; break;
            case 1: className = "Papel y Cartón"; sendSignal = "B"; break;
            case 2: className = "Orgánico"; sendSignal = "C"; break;
            case 3: className = "Latas y Aluminio"; sendSignal = "D"; break;
            case 4: className = "Indefinido"; sendSignal = "E"; break;
            default: sendSignal = "";
        }

        const classPrediction = `${className}: ${prediction[i].probability.toFixed(2)}`;
        imageLabelContainer.childNodes[i].innerHTML = classPrediction;

        let printValue = prediction[i].probability > 0.60 ? sendSignal : "";

        if (previousPredictionState[i] !== printValue) {
            if (printValue !== "") {
                console.log(`Predicción ${className}: ${printValue}`);
                sendCommand(printValue);  // Enviar el comando al ESP32 a través de WebSocket
            }
        }

        newPredictionState[i] = printValue;
    }

    previousPredictionState = newPredictionState;
}

// Función para enviar un comando al ESP32 vía WebSocket
function sendCommand(command) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(command);  // Enviar el comando al ESP32
        console.log(`Comando enviado al ESP32: ${command}`);
    } else {
        console.error('WebSocket no está abierto.');
    }
}

// Iniciar WebSocket y reconocimiento de imágenes al cargar la página
window.onload = function() {
    initWebSocket();  // Iniciar conexión WebSocket
    initImageRecognition();  // Iniciar reconocimiento de imágenes
};
