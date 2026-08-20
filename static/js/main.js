function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({
        behavior: "smooth"
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.innerText = message;
    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}


async function predict() {

    const symptoms = document.getElementById("symptoms").value.trim();
    const result = document.getElementById("result");

    if (!symptoms) {
        showToast("Please enter your symptoms first.");
        return;
    }

    result.innerHTML = `
        <div class="result-success">
            <p>🤖 AI is analyzing your symptoms...</p>
        </div>
    `;

    try {

        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                symptoms: symptoms
            })
        });

        const data = await response.json();

        if (data.error) {

            result.innerHTML = `
                <div class="result-warning">
                    ${data.error}
                </div>
            `;

            return;
        }

        result.innerHTML = `
            <div class="${data.emergency ? "result-warning" : "result-success"}">

                <h3>
                    ${data.emergency ? "🚨 Emergency Warning" : "🤖 AI Assessment"}
                </h3>

                <p>
                    <strong>Possible condition:</strong>
                    ${data.prediction}
                </p>

                <p>
                    <strong>AI confidence:</strong>
                    ${data.confidence}%
                </p>

                <p>
                    ${data.message}
                </p>

            </div>
        `;

    } catch (error) {

        result.innerHTML = `
            <div class="result-warning">
                Unable to connect to the AI service.
            </div>
        `;
    }
}


async function addReminder() {

    const medicine = document.getElementById("medicine").value.trim();
    const time = document.getElementById("medicineTime").value;
    const container = document.getElementById("reminders");

    if (!medicine || !time) {
        showToast("Enter medicine name and time.");
        return;
    }

    try {

        const response = await fetch("/reminder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                medicine: medicine,
                time: time
            })
        });

        const data = await response.json();

        if (data.status === "success") {

            container.innerHTML = `
                <div class="result-success">
                    💊 ${data.medicine} scheduled for ${data.time}
                </div>
            `;

            document.getElementById("medicine").value = "";
            document.getElementById("medicineTime").value = "";

            showToast("Medicine reminder added.");

        } else {

            showToast(data.error || "Unable to add reminder.");
        }

    } catch (error) {

        showToast("Unable to connect to server.");
    }
}


async function sendSOS() {

    const container = document.getElementById("sosResult");

    const confirmed = confirm(
        "Are you sure you want to activate the emergency SOS?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch("/sos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Emergency assistance required"
            })
        });

        const data = await response.json();

        container.innerHTML = `
            <div class="result-warning">
                🚨 ${data.status}
                <br>
                ${data.message}
            </div>
        `;

        showToast("Emergency SOS activated.");

    } catch (error) {

        showToast("Unable to activate SOS.");
    }
}


async function findHospitals() {

    const container = document.getElementById("hospitalResult");

    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📍</div>
            <h3>Getting your location...</h3>
            <p>Please allow location access.</p>
        </div>
    `;

    if (!navigator.geolocation) {

        container.innerHTML = `
            <div class="result-warning">
                Location services are not supported by your browser.
            </div>
        `;

        return;
    }

   navigator.geolocation.getCurrentPosition(

    async function(position) {

        // Get user's REAL GPS coordinates
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Debug information
        console.log("========== GPS LOCATION ==========");
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);
        console.log("Accuracy:", accuracy, "meters");
        console.log("===================================");

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📍</div>
                <h3>Location detected</h3>
                <p>
                    Latitude: ${latitude.toFixed(6)}<br>
                    Longitude: ${longitude.toFixed(6)}<br>
                    GPS Accuracy: ±${Math.round(accuracy)} meters
                </p>
                <p>Searching nearby hospitals...</p>
            </div>
        `;

        try {

            const response = await fetch(
                `/hospitals?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`
            );

            if (!response.ok) {
                throw new Error("Server error");
            }

            const hospitals = await response.json();

            if (!Array.isArray(hospitals) || hospitals.length === 0) {

                container.innerHTML = `
                    <div class="result-warning">
                        No mapped hospitals were found near your location.
                    </div>
                `;

                return;
            }

            container.innerHTML = hospitals.map(hospital => `

                <div class="hospital-card">

                    <h3>🏥 ${hospital.name}</h3>

                    <p>
                        📍 <strong>${hospital.distance} km away</strong>
                    </p>

                    <p>
                        ${hospital.address}
                    </p>

                    <p>
                        📞 ${hospital.phone}
                    </p>

                    <a
                        href="${hospital.maps_url}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="maps-button"
                    >
                        🗺️ Get Directions
                    </a>

                </div>

            `).join("");

        } catch (error) {

            console.error("Hospital search error:", error);

            container.innerHTML = `
                <div class="result-warning">
                    Unable to retrieve hospitals.
                    Please check your internet connection.
                </div>
            `;
        }
    },

    function(error) {

        console.error("GPS Error:", error);

        let message = "Unable to get your location.";

        if (error.code === 1) {
            message = "Location permission was denied. Please allow location access.";
        }
        else if (error.code === 2) {
            message = "Your location could not be determined. Please enable GPS/location services.";
        }
        else if (error.code === 3) {
            message = "Location request timed out. Please try again.";
        }

        container.innerHTML = `
            <div class="result-warning">
                📍 ${message}
            </div>
        `;
    },

    {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
    }
  );
}


async function submitFeedback() {

    const message = document.getElementById("feedback").value.trim();

    const rating = parseInt(
        document.getElementById("rating").value
    );

    if (!message) {
        showToast("Please enter your feedback.");
        return;
    }

    try {

        const response = await fetch("/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                rating: rating
            })
        });

        const data = await response.json();

        document.getElementById("feedbackResult").innerHTML = `
            <div class="result-success">
                ⭐ Thank you for your feedback!
            </div>
        `;

        document.getElementById("feedback").value = "";

    } catch (error) {

        showToast("Unable to submit feedback.");
    }
}


function startVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        showToast(
            "Voice recognition is not supported in this browser."
        );

        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    showToast("🎤 Listening...");

    recognition.start();

    recognition.onresult = function(event) {

        const text =
            event.results[0][0].transcript;

        document.getElementById("symptoms").value = text;

        showToast("Voice converted to text.");
    };

    recognition.onerror = function() {

        showToast("Unable to recognize your voice.");
    };
}


let smartwatchMonitoring = false;
let smartwatchTimer = null;


async function connectDevice() {

    if (smartwatchMonitoring) {

        showToast("⌚ MARV NEO is already connected.");

        return;
    }

    showToast("⌚ Connecting to MARV NEO...");

    try {

        const response = await fetch("/watch-data");

        if (!response.ok) {
            throw new Error("Smartwatch server error");
        }

        const data = await response.json();

        if (data.connected) {

            smartwatchMonitoring = true;

            updateSmartwatchVitals(data);

            showToast("🟢 MARV NEO connected successfully.");

            startSmartwatchMonitoring();

        } else {

            updateSmartwatchOffline();

            showToast(
                "🔴 MARV NEO is not connected to the laptop."
            );
        }

    } catch (error) {

        updateSmartwatchOffline();

        showToast(
            "Unable to connect to MARV NEO."
        );
    }
}


function updateSmartwatchVitals(data) {

    const heartRate =
        document.getElementById("heartRate");

    const spo2 =
        document.getElementById("spo2");

    const temperature =
        document.getElementById("temperature");

    const bloodPressure =
        document.getElementById("bloodPressure");


    if (data.heart_rate !== null &&
        data.heart_rate !== undefined) {

        heartRate.innerText =
            data.heart_rate;

    } else {

        heartRate.innerText = "--";
    }


    spo2.innerText = "--";

    temperature.innerText = "--";

    bloodPressure.innerText = "--";
}


function updateSmartwatchOffline() {

    document.getElementById("heartRate").innerText = "--";

    document.getElementById("spo2").innerText = "--";

    document.getElementById("temperature").innerText = "--";

    document.getElementById("bloodPressure").innerText = "--";
}


function startSmartwatchMonitoring() {

    if (smartwatchTimer) {
        clearInterval(smartwatchTimer);
    }

    smartwatchTimer = setInterval(
        getSmartwatchData,
        3000
    );
}


async function getSmartwatchData() {

    try {

        const response =
            await fetch("/watch-data");

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data =
            await response.json();

        if (data.connected) {

            updateSmartwatchVitals(data);

        } else {

            smartwatchMonitoring = false;

            updateSmartwatchOffline();

        }

    } catch (error) {

        smartwatchMonitoring = false;

        updateSmartwatchOffline();
    }
}


window.addEventListener(
    "DOMContentLoaded",
    function() {

        getSmartwatchData();

    }
);
let watchConnected = false;

async function updateWatchData() {

    try {

        const response = await fetch(
            "/watch-data",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        watchConnected = data.connected;

        updateWatchConnectionUI(
            data.connected,
            data.device
        );

        if (
            data.heart_rate !== null &&
            data.heart_rate !== undefined
        ) {

            document.getElementById(
                "heartRate"
            ).innerText =
                Math.round(data.heart_rate);

        }

        if (
            data.spo2 !== null &&
            data.spo2 !== undefined
        ) {

            document.getElementById(
                "spo2"
            ).innerText =
                Math.round(data.spo2);

        }

        if (
            data.temperature !== null &&
            data.temperature !== undefined
        ) {

            document.getElementById(
                "temperature"
            ).innerText =
                Number(
                    data.temperature
                ).toFixed(1);

        }

        if (
            data.blood_pressure !== null &&
            data.blood_pressure !== undefined
        ) {

            document.getElementById(
                "bloodPressure"
            ).innerText =
                data.blood_pressure;

        }

    } catch (error) {

        updateWatchConnectionUI(
            false,
            "MARV NEO"
        );

    }
}


function updateWatchConnectionUI(
    connected,
    device
) {

    const button =
        document.querySelector(
            ".outline-btn"
        );

    if (!button) {
        return;
    }

    if (connected) {

        button.innerText =
            "🟢 MARV NEO Connected";

    } else {

        button.innerText =
            "🔵 Connect IoT Device";

    }
}


function connectDevice() {

    if (watchConnected) {

        showToast(
            "🟢 MARV NEO is connected."
        );

    } else {

        showToast(
            "🔵 Searching for MARV NEO..."
        );

    }

    updateWatchData();
}


setInterval(
    updateWatchData,
    2000
);


updateWatchData();