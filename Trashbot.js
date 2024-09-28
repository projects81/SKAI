// Definición del modelo de reconocimiento de imágenes

        // URL del modelo y los metadatos proporcionados por Teachable Machine
        const imageURL = "https://teachablemachine.withgoogle.com/models/wLnBIqF8F/";
        let imageModel, webcam, imageLabelContainer, maxImagePredictions;

        // Función para inicializar el reconocimiento de imágenes
        async function initImageRecognition() {
            // Carga del modelo y los metadatos
            const modelURL = imageURL + "model.json";
            const metadataURL = imageURL + "metadata.json";

            // Carga del modelo y obtención del número máximo de clases
            imageModel = await tmImage.load(modelURL, metadataURL);
            maxImagePredictions = imageModel.getTotalClasses();

            // Configuración de la cámara web y el lienzo para mostrar la imagen
            const flip = true;
            webcam = new tmImage.Webcam(400, 400, flip);    //Se crea una instancía de lac clase Webcam
            await webcam.setup();
            await webcam.play();
            window.requestAnimationFrame(imageLoop);

            // Mostrar el lienzo de la cámara web en el contenedor
            document.getElementById("webcam-container").appendChild(webcam.canvas);

            // Creación de contenedores para las etiquetas de clasificación
            imageLabelContainer = document.getElementById("image-label-container");
            for (let i = 0; i < maxImagePredictions; i++) {
                imageLabelContainer.appendChild(document.createElement("div"));
            }
        }

        // Función para actualizar y predecir las imágenes continuamente
        async function imageLoop() {
            webcam.update();
            await predictImage();
            window.requestAnimationFrame(imageLoop);
        }

        // Función para realizar las predicciones con el modelo de imágenes
        // Función para realizar las predicciones con el modelo de imágenes
// Variables para rastrear el estado anterior
let previousPredictionState = [];

// Función para realizar las predicciones con el modelo de imágenes
async function predictImage() {
    const prediction = await imageModel.predict(webcam.canvas);
    let newPredictionState = [];

    for (let i = 0; i < maxImagePredictions; i++) {
        let className = "";
        let sendSignal = "";
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
            sendSignal = "E";
        } 

    
        const classPrediction =
            className + ": " + prediction[i].probability.toFixed(2);
        imageLabelContainer.childNodes[i].innerHTML = classPrediction;
    
        let printValue = prediction[i].probability > 0.60 ? sendSignal : "";
    
        if (previousPredictionState[i] !== printValue) {
            if (printValue !== "") {
                console.log(`Predicción ${className}: ${printValue}`);
                sendCommand(printValue); // Llamar a la función sendCommand con printValue

                // Si se detecta "Botellas" con probabilidad > 0.70, redirigir a "animación1.html"
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
            }
        }
        
    
        newPredictionState[i] = printValue;
    }
    
    

    // Actualizar el estado anterior
    previousPredictionState = newPredictionState;

}

// Definición de la función sendCommand que recibe un parámetro "printValue"
async function sendCommand(printValue) {
    const url = `https://192.168.0.184/${printValue}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors', // Omitir el CORS para peticiones locales
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
