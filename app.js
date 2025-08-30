document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const cameraPreview = document.getElementById('camera-preview');
    const permissionBtn = document.getElementById('permission-btn');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const countdown = document.getElementById('countdown');
    
    // Global variables
    let stream = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let hasPermission = false;
    
    // Event listeners
    permissionBtn.addEventListener('click', requestPermissions);
    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    
    // Check if permissions are already granted
    checkPermissions();
    
    // Functions
    async function checkPermissions() {
        try {
            // Check if permissions are already granted
            const result = await navigator.permissions.query({ name: 'camera' });
            if (result.state === 'granted') {
                await setupCamera();
            }
        } catch (error) {
            console.log('Permissions API not supported, will request directly');
        }
    }
    
    async function requestPermissions() {
        try {
            await setupCamera();
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Camera access denied. Please enable permissions in your browser settings.');
        }
    }
    
    async function setupCamera() {
        try {
            // Always use the front camera (user-facing) with simple constraints
            // Using the same simple constraints as the Reset Camera button
            const constraints = {
                video: { 
                    facingMode: 'user' // Front camera for selfies, no resolution constraints
                },
                audio: true
            };
            
            // Detect iOS device
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            // iOS Safari sometimes needs specific audio constraints
            if (isIOS) {
                console.log('Using iOS-specific constraints');
                constraints.audio = {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                };
            }
            
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                console.log('Could not get preferred constraints, trying with defaults');
                // Fallback to more flexible constraints
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            }
            
            // Connect the stream to the video element
            cameraPreview.srcObject = stream;
            
            // Get the actual track settings to adjust the UI if needed
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log('Camera settings:', settings);
            
            // Check camera orientation and log details
            if (settings.width && settings.height) {
                const isPortrait = settings.height > settings.width;
                console.log('Camera orientation is', isPortrait ? 'portrait' : 'landscape');
                console.log('Actual camera dimensions:', settings.width, 'x', settings.height);
            }
            
            // Update UI
            hasPermission = true;
            permissionBtn.style.display = 'none';
            startBtn.disabled = false;
            
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw error;
        }
    }
    
    async function startRecording() {
        // Check if we have permission
        if (!hasPermission) {
            await requestPermissions();
            return;
        }
        
        // Start countdown
        startBtn.disabled = true;
        await runCountdown();
        
        // Setup media recorder
        recordedChunks = [];
        
        try {
            // Check for supported MIME types (iOS Safari doesn't support webm)
            let mimeType = 'video/webm';
            
            // Detect iOS device
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            // Try to find a supported MIME type
            if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                mimeType = 'video/webm;codecs=vp8';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            }
            
            console.log('Using MIME type:', mimeType);
            mediaRecorder = new MediaRecorder(stream, { mimeType });
        } catch (err) {
            console.error('MediaRecorder error:', err);
            
            // Detect iOS device
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            // Provide more detailed error for debugging
            if (isIOS) {
                console.log('iOS device detected, error might be related to MIME type or permissions');
            }
            
            alert('Failed to start recording. Please try again. Error: ' + err.message);
            startBtn.disabled = false;
            return;
        }
        
        // MediaRecorder event handlers
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            // Use the same MIME type that was selected for recording
            const mimeType = mediaRecorder.mimeType;
            const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            
            // Create a blob from the recorded chunks
            const blob = new Blob(recordedChunks, { type: mimeType });
            
            // Create a download link for the recorded video
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `snipe-recording.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            // Reset UI
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            startBtn.disabled = false;
        };
        
        // Start recording
        mediaRecorder.start(1000); // Collect data in 1-second chunks
        
        // Update UI
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        stopBtn.disabled = false;
    }
    
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            stopBtn.disabled = true;
        }
    }
    
    async function runCountdown() {
        countdown.style.display = 'block';
        
        // Countdown from 3 to 1
        for (let i = 3; i >= 1; i--) {
            countdown.textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        countdown.style.display = 'none';
    }
});