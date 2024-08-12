function checkEmails() {
  const query = 'from:mciasar.barleta@barleta.ro is:unread'; // Update with the sender's email address
  const threads = GmailApp.search(query);

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const message of messages) {
      processMessage(message);
      message.markRead(); // Mark message as read
    }
  }
}

function processMessage(message) {
  const subject = message.getSubject();
  const lastThreeLetters = subject.slice(-3); // Get the last 3 letters of the subject
  
  const attachments = message.getAttachments();

  for (const attachment of attachments) {
    const fileBlob = attachment.copyBlob();

    // Send the file blob to the API
    const responseBlob = sendToAPI(fileBlob, lastThreeLetters);

    // Send the file via email
    sendEmailWithAttachment(responseBlob, lastThreeLetters);
  }
}

function sendToAPI(fileBlob, fileNameSuffix) {
  const url = 'https://fluturas-inatorul.vercel.app/api/extract'; // Replace with your Vercel API endpoint
  
  const formData = {
    file: fileBlob
  };
  
  const payload = {
    method: 'POST',
    payload: formData,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, payload);
  
  // Get the response as text
  const responseText = response.getContentText();

  // Remove the first and last characters from the response
  const cleanedBase64 = responseText.slice(1, -1); // Removes the first and last character

  // Call the PDF to PNG API with cleaned base64
  const pngBlob = callPeDeFeInatorul(cleanedBase64, fileNameSuffix);
  
  // Set the MIME type for a PNG file
  pngBlob.setContentType('image/png');
  
  return pngBlob;
}

function callPeDeFeInatorul(png_64, fileNameSuffix) {
  const url = 'https://flask-hello-world-xi0b.onrender.com/convert'; // Replace with your Vercel API endpoint
  
  const payload = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({
      pdf_base64: png_64
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, payload);
  const responseData = JSON.parse(response.getContentText());

  // Decode the base64 string into a blob
  const pngBase64 = responseData.png_base64;
  const pngBlob = base64ToBlob(pngBase64);

  // Rename the file with the suffix
  pngBlob.setName(`fluturas_${fileNameSuffix}.png`);

  return pngBlob;
}

function base64ToBlob(base64) {
  const decodedBytes = Utilities.base64Decode(base64);
  return Utilities.newBlob(decodedBytes);
}

function sendEmailWithAttachment(fileBlob, fileNameSuffix) {
  const recipient = 'cosaaugustin1@gmail.com'; // Replace with the recipient's email address
  const subject = 'Fluturas';
  
  // Create a unique identifier for the inline image
  const imageCid = 'fluturasImage';

  // HTML body with the embedded image
  const htmlBody = `
    <p>Here is the file you requested:</p>
    <img src="cid:${imageCid}" alt="Fluturas Image" />
  `;
  
  // Send the email with the image inline
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    htmlBody: htmlBody,
    inlineImages: {
      [imageCid]: fileBlob
    },
    attachments: [fileBlob] // Optionally include the image as an attachment as well
  });
}
