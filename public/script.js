const fileInput = document.getElementById('fileInput');
// const uploadButton = document.getElementById('uploadButton');
const pdfCanvas = document.getElementById('pdfCanvas');
const signatureCanvas = document.getElementById('signatureCanvas');
const clearButton = document.getElementById('clearButton');
const submitButton = document.getElementById('submitButton');

const pdfContext = pdfCanvas.getContext('2d');
const signatureContext = signatureCanvas.getContext('2d');
let isDrawing = false;

// // Load PDF.js
// pdfjsLib.GlobalWorkerOptions.workerSrc =
//   'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.min.js';

// // Handle PDF file upload and preview
// uploadButton.addEventListener('click', async () => {
//   const file = fileInput.files[0];
//   if (!file) {
//     alert('Please select a PDF file');
//     return;
//   }

//   const reader = new FileReader();
//   reader.onload = async function () {
//     const typedArray = new Uint8Array(this.result);
//     const pdf = await pdfjsLib.getDocument(typedArray).promise;

//     const page = await pdf.getPage(1);
//     const viewport = page.getViewport({ scale: 1.5 });

//     pdfCanvas.height = viewport.height;
//     pdfCanvas.width = viewport.width;

//     const renderContext = {
//       canvasContext: pdfContext,
//       viewport: viewport,
//     };
//     await page.render(renderContext).promise;
//   };
//   reader.readAsArrayBuffer(file);
// });



// Load PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.min.js';

// Function to load and render PDF preview
const loadPdfPreview = async (file) => {
  const reader = new FileReader();
  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    pdfCanvas.height = viewport.height;
    pdfCanvas.width = viewport.width;

    const renderContext = {
      canvasContext: pdfContext,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
  };
  reader.readAsArrayBuffer(file);
};

// Automatically show PDF preview when a file is selected
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    loadPdfPreview(file);
  }
});

// Handle drawing on signature canvas
signatureCanvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  signatureContext.beginPath();
  signatureContext.moveTo(e.offsetX, e.offsetY);
});

signatureCanvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    signatureContext.lineTo(e.offsetX, e.offsetY);
    signatureContext.stroke();
  }
});

signatureCanvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

clearButton.addEventListener('click', () => {
  signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
});

submitButton.addEventListener('click', async () => {
  const signatureDataUrl = signatureCanvas.toDataURL('image/png');
  const pdfFile = fileInput.files[0];
  if (!pdfFile) {
    alert('Please upload a PDF first');
    return;
  }

  const formData = new FormData();
  formData.append('file', pdfFile);
  formData.append('signature', signatureDataUrl);

  try {
    const response = await fetch('/pdf/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'signed-document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      alert('Document signed and downloaded successfully!');
    } else {
      alert('Failed to submit the signed document');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error submitting signed document');
  }

});
