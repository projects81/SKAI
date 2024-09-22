// URL del modelo y los metadatos proporcionados por Teachable Machine
const imageURL = "https://teachablemachine.withgoogle.com/models/wLnBIqF8F/";
let imageModel, webcam, imageLabelContainer, maxImagePredictions;

// Función para inicializar el reconocimiento de imágenes
async function initImageRecognition() {
    // Cargar el modelo y los metadatos
    const modelURL = imageURL + "model.json";
    const metadataURL = imageURL + "metadata.json";

    // Cargar el modelo de imágenes
    imageModel = await tmImage.load(modelURL, metadataURL);
    maxImagePredictions = imageModel.getTotalClasses();

    // Configuración de la cámara web
    const flip = true;
    webcam = new tmImage.Webcam(400, 400, flip);    // Iniciar la webcam
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(imageLoop);

    // Mostrar el lienzo de la cámara web
    document.getElementById("webcam-container").appendChild(webcam.canvas);

    // Crear contenedores para las etiquetas de clasificación
    imageLabelContainer = document.getElementById("image-label-container");
    for (let i = 0; i < maxImagePredictions; i++) {
        imageLabelContainer.appendChild(document.createElement("div"));
    }
}

// Función para actualizar la imagen continuamente y predecir
async function imageLoop() {
    webcam.update();
    await predictImage();
    window.requestAnimationFrame(imageLoop);
}

// Variables para rastrear el estado anterior
let previousPredictionState = [];

// Función para realizar las predicciones con el modelo de imágenes
async function predictImage() {
    const prediction = await imageModel.predict(webcam.canvas);
    let newPredictionState = [];

    for (let i = 0; i < maxImagePredictions; i++) {
        let className = "";
        let sendSignal = "";

        // Asignar las clases y los comandos correspondientes
        switch (i) {
            case 0:
                className = "Plástico";
                sendSignal = "A";
                break;
            case 1:
                className = "Papel y Cartón";
                sendSignal = "B";
                break;
            case 2:
                className = "Orgánico";
                sendSignal = "C";
                break;
            case 3:
                className = "Latas y Aluminio";
                sendSignal = "D";
                break;
            case 4:
                className = "Indefinido";
                sendSignal = "E";
                break;
            default:
                sendSignal = "";
        }

        // Mostrar la probabilidad de la predicción
        const classPrediction = `${className}: ${prediction[i].probability.toFixed(2)}`;
        imageLabelContainer.childNodes[i].innerHTML = classPrediction;

        // Solo enviar si la probabilidad es mayor a 0.60
        let printValue = prediction[i].probability > 0.60 ? sendSignal : "";

        // Detectar cambios en las predicciones
        if (previousPredictionState[i] !== printValue) {
            if (printValue !== "") {
                console.log(`Predicción ${className}: ${printValue}`);
                sendCommand(printValue); // Llamar a la función sendCommand con printValue

                // Redirigir a la página de animación según el resultado
                switch (printValue) {
                    case "A":
                        window.location.href = "animacion4.html";
                        break;
                    case "B":
                        window.location.href = "animacion2.html";
                        break;
                    case "C":
                        window.location.href = "animacion1.html";
                        break;
                    case "D":
                        window.location.href = "animacion3.html";
                        break;
                    default:
                        // No hacer nada para el caso "E" u otros
                        break;
                }
            }
        }

        // Actualizar el estado de la predicción
        newPredictionState[i] = printValue;
    }

    // Actualizar el estado anterior
    previousPredictionState = newPredictionState;
}

// Definición de la función sendCommand que recibe un parámetro "printValue"
async function sendCommand(printValue) {
    // Construir la URL para enviar el comando al ESP32
    const url = `http://192.168.0.14/${printValue}`;

    try {
        // Realizar la solicitud fetch a la URL del ESP32
        const response = await fetch(url);
        const responseData = await response.text();
        console.log(`Respuesta del ESP32: ${responseData}`);
    } catch (error) {
        console.error('Error al enviar comando al ESP32:', error);
    }
}
