export function Name() { return "Razer Chroma"; }
export function VendorId() { return 0x1532; } // Razer's USB Vendor ID
export function ProductId() { return 0x0000; } // Adjust as needed
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/brand"; }
export function Size() { return [30, 10]; }
export function DefaultPosition(){ return [240, 120]; }
export function DefaultScale(){ return 8.0; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
	];
}

let vLedNames = ["Chroma LED"];
let vLedPositions = [[0, 0]];

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

const CHROMA_URL = "http://localhost:54235/razer/chromasdk"; // Razer Chroma SDK base URL
let sessionUrl = "";
let heartbeatInterval;

async function createChromaSession() {
    let response = await fetch(CHROMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: "SignalRGB Integration",
            description: "Control Razer Chroma devices with SignalRGB",
            author: { name: "WhirlwindFX", contact: "support@whirlwindfx.com" },
            device_supported: ["keyboard", "mouse", "headset", "mousepad", "keypad", "chromalink"],
            category: "application"
        })
    });
    let data = await response.json();
    sessionUrl = data.uri;
    startHeartbeat();
}

async function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(async () => {
        await fetch(`${sessionUrl}/heartbeat`, { method: "PUT" });
    }, 10000); // Every 10 seconds
}

async function sendColorsToChroma(colorData) {
    if (!sessionUrl) return;
    let response = await fetch(`${sessionUrl}/chromalink`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ effect: "CHROMA_STATIC", param: colorData })
    });
    return response.ok;
}

export function Initialize() {
    createChromaSession();
}

export function Render() {
    let colorArray = [];
    for (let idx = 0; idx < vLedPositions.length; idx++) {
        let color;
        if (LightingMode === "Forced") {
            color = hexToRgb(forcedColor);
        } else {
            let [iPxX, iPxY] = vLedPositions[idx];
            color = device.color(iPxX, iPxY);
        }
        colorArray.push({ red: color[0], green: color[1], blue: color[2] });
    }
    sendColorsToChroma(colorArray);
    device.pause(1);
}

export function Shutdown(SystemSuspending) {
    if (heartbeatInterval) clearInterval(heartbeatInterval); // Stop heartbeat on shutdown
    if (SystemSuspending) {
        sendColorsToChroma({ red: 0, green: 0, blue: 0 });
    } else {
        sendColorsToChroma(hexToRgb(shutdownColor));
    }
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

export function Validate(endpoint) {
    return endpoint.interface === 0 && endpoint.usage === 0x0000 && endpoint.usage_page === 0x0000 && endpoint.collection === 0x0000;
}

export function ImageUrl() {
	return "https://assets.razerzone.com/dev_portal/REST/html/razer.png";
}
