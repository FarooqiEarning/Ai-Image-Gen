// --- DOM Elements ---
const promptInput = document.getElementById('prompt');
const modelSelect = document.getElementById('model');
const sizeSelect = document.getElementById('size');
const generateBtn = document.getElementById('generate-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const resultContainer = document.getElementById('result-container');
const generatedImage = document.getElementById('generated-image');
const downloadBtn = document.getElementById('download-btn');
const errorMessageDiv = document.getElementById('error-message');

// --- API Configuration ---
const API_ENDPOINT = 'https://beta.sree.shop/v1/images/generations';
// Read API Key from environment variable (Vite specific - MUST start with VITE_)
const API_KEY = import.meta.env.VITE_Sree_Api_Key;

// --- Event Listeners ---
generateBtn.addEventListener('click', handleGenerateClick);

// --- Functions ---

async function handleGenerateClick() {
  const prompt = promptInput.value.trim();
  const model = modelSelect.value;
  const size = sizeSelect.value;

  if (!prompt) {
    showError('Please enter an image prompt.');
    return;
  }

  // Check if the API key is missing or still the placeholder
  // Note: Vite replaces env vars at build time. If it's missing, it will be undefined.
  // The placeholder check might not be strictly necessary but can catch copy-paste errors.
  if (!API_KEY) {
     showError('API Key is missing or not configured. Please set VITE_Sree_Api_Key in your .env file.');
     console.error("API Key is missing. Ensure you have a .env file with VITE_Sree_Api_Key='YOUR_KEY'");
     return;
  }

  // --- UI Updates: Start Loading ---
  showLoading(true);
  showError(null); // Clear previous errors
  showResult(false);

  try {
    const requestBody = {
      model: model,
      prompt: prompt,
      n: 1, // Generate one image
      size: size,
      response_format: 'url', // We want the image URL
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Attempt to read error details from the API response
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore if response is not JSON
      }
      const errorDetail = errorData?.error?.message || `HTTP error! Status: ${response.status}`;
      throw new Error(`API Error: ${errorDetail}`);
    }

    const data = await response.json();

    if (data.data && data.data.length > 0 && data.data[0].url) {
      const imageUrl = data.data[0].url;
      displayImage(imageUrl);
      showResult(true);
    } else {
      throw new Error('API response did not contain a valid image URL.');
    }

  } catch (error) {
    console.error('Error generating image:', error);
    showError(`Failed to generate image. ${error.message}`);
    showResult(false); // Hide result container on error
  } finally {
    // --- UI Updates: Stop Loading ---
    showLoading(false);
  }
}

function displayImage(imageUrl) {
  generatedImage.src = imageUrl;
  // Update download link
  downloadBtn.href = imageUrl;
  // Suggest a filename based on the prompt (simple version)
  const filename = promptInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30) || 'generated_image';
  downloadBtn.download = `${filename}.png`;
}

function showLoading(isLoading) {
  loadingSpinner.style.display = isLoading ? 'block' : 'none';
  generateBtn.disabled = isLoading; // Disable button while loading
  generateBtn.textContent = isLoading ? 'Generating...' : 'Generate Image';
}

function showResult(isVisible) {
    resultContainer.style.display = isVisible ? 'block' : 'none';
}

function showError(message) {
    if (message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    } else {
        errorMessageDiv.style.display = 'none';
        errorMessageDiv.textContent = '';
    }
}

// --- Initial Setup ---
// Check if the API key was loaded correctly by Vite
if (!API_KEY) {
    console.warn("API Key is not configured. Please create a .env file in the project root and add VITE_Sree_Api_Key='YOUR_KEY'. Make sure to restart the dev server after creating/modifying the .env file.");
    showError('API Key not configured. See console for details.');
} else {
    console.log("AI Image Generator Initialized. API Key loaded.");
}
