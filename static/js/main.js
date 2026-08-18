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

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏥</div>
                    <h3>Searching nearby hospitals...</h3>
                    <p>Finding real healthcare facilities near you.</p>
                </div>
            `;

            try {

                const response = await fetch(
                    `/hospitals?latitude=${latitude}&longitude=${longitude}`
                );

                if (!response.ok) {
                    throw new Error("Server error");
                }

                const hospitals = await response.json();

                if (!hospitals.length) {

                    container.innerHTML = `
                        <div class="result-warning">
                            No mapped hospitals were found within 20 km.
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
                            class="maps-button"
                        >
                            🗺️ Get Directions
                        </a>

                    </div>

                `).join("");

            } catch (error) {

                container.innerHTML = `
                    <div class="result-warning">
                        Unable to retrieve hospitals.
                        Please check your internet connection.
                    </div>
                `;

            }
        },

        function(error) {

            container.innerHTML = `
                <div class="result-warning">
                    📍 Location access is required.
                    Please allow location permission and try again.
                </div>
            `;

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
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


function connectDevice() {

    showToast(
        "IoT device connection module is ready for ESP32 integration."
    );

    document.getElementById("heartRate").innerText = "--";
    document.getElementById("spo2").innerText = "--";
    document.getElementById("temperature").innerText = "--";
    document.getElementById("bloodPressure").innerText = "--";
}