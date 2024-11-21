// URL del modelo y los metadatos proporcionados por Teachable Machine
const imageURL = "https://teachablemachine.withgoogle.com/models/wLnBIqF8F/";
let imageModel, webcam, imageLabelContainer, maxImagePredictions;
let hasSentCommand = false;  // Flag para detener predicciones

// Función para inicializar el reconocimiento de imágenes
async function initImageRecognition() {
    const modelURL = imageURL + "model.json";
    const metadataURL = imageURL + "metadata.json";

    // Cargar el modelo de Teachable Machine
    imageModel = await tmImage.load(modelURL, metadataURL);
    maxImagePredictions = imageModel.getTotalClasses();

    // Configuración de la cámara web
    const flip = true;
    webcam = new tmImage.Webcam(400, 400, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(imageLoop);

    // Mostrar el lienzo de la cámara web
    document.getElementById("webcam-container").appendChild(webcam.canvas);

    // Creación de contenedores para las etiquetas de clasificación
    imageLabelContainer = document.getElementById("image-label-container");
    for (let i = 0; i < maxImagePredictions; i++) {
        imageLabelContainer.appendChild(document.createElement("div"));
    }
}

// Función para actualizar y predecir imágenes continuamente
async function imageLoop() {
    if (!hasSentCommand) {  // Solo seguir prediciendo si no se ha enviado un comando
        webcam.update();
        await predictImage();
        window.requestAnimationFrame(imageLoop);
    }
}

// Variables para rastrear el estado anterior
let previousPredictionState = [];

// Función para realizar las predicciones con el modelo de imágenes
async function predictImage() {
    const prediction = await imageModel.predict(webcam.canvas);
    let newPredictionState = [];

    // Recorrer cada predicción para actualizar el estado y enviar el comando correspondiente
    for (let i = 0; i < maxImagePredictions; i++) {
        let className = "";
        let sendSignal = "";

        // Asignar nombres y señales basadas en las clases de predicción
        if (i === 0) {
            className = "Plástico";
            sendSignal = "A";
        } else if (i === 1) {
            className = "Papel y Cartón";
            sendSignal = "B";
        } else if (i === 2) {
            className = "Orgánico";
            sendSignal = "C";
        } else if (i === 3) {
            className = "Latas y Aluminio";
            sendSignal = "D";
        } else if (i === 4) {
            className = "Indefinido";
        }

        const classPrediction = className + ": " + prediction[i].probability.toFixed(2);
        imageLabelContainer.childNodes[i].innerHTML = classPrediction;

        // Solo enviar el comando si la probabilidad es mayor a 60%
        let printValue = prediction[i].probability > 0.60 ? sendSignal : "";

        // Comparar el estado actual con el anterior para evitar enviar señales duplicadas
        if (previousPredictionState[i] !== printValue) {
            if (printValue !== "" && !hasSentCommand) {  // Asegurarse de que no se haya enviado previamente
                console.log(`Predicción ${className}: ${printValue}`);
                
                // Enviar el valor de predicción al ESP32
                sendCommand(printValue);

                // Detener más predicciones y redirigir
                hasSentCommand = true;
                setTimeout(() => {
                    if (printValue === "C") {
                        window.location.href = "animacion1.html";
                    }
                    if (printValue === "B") {
                        window.location.href = "animacion2.html";
                    }
                    if (printValue === "D") {
                        window.location.href = "animacion3.html";
                    }
                    if (printValue === "A") {
                        window.location.href = "animacion4.html";
                    }
                }, 2000);

                break;  // Rompe el bucle, ya que solo quieres enviar una vez y redirigir
            }
        }
        newPredictionState[i] = printValue;
    }

    // Actualizar el estado anterior
    previousPredictionState = newPredictionState;
}

// Función para enviar el comando al ESP32
async function sendCommand(printValue) {
    const url = `http://192.168.230.103:8080/${printValue}`;  // Usa la IP actual de tu ESP32 y el puerto 8080

    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors', // Configurar correctamente el CORS si es necesario
        });

        if (!response.ok) {
            throw new Error('Error al enviar el comando al ESP32');
        }

        const data = await response.text();
        console.log('Respuesta del ESP32:', data);
    } catch (error) {
        console.error('Error en la solicitud:', error);
    }
}

// Iniciar cuando la página cargue
window.onload = function() {
    initImageRecognition();
};
