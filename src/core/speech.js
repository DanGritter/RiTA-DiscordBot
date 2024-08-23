const speech = require("@google-cloud/speech").v2;

const projectId = "<ProjectId>";
const recognizerId = "en123";

const client = new speech.SpeechClient();

async function createRecognizer()
{
   const recognizerRequest = {
      parent: `projects/${projectId}/locations/global`,
      recognizerId,
      recognizer: {
         defaultRecognitionConfig: {
            explicitDecodingConfig: {
               encoding: "LINEAR16",
               sampleRateHertz: 16000,
               audioChannelCount: 1
            }
         },
         languageCodes: ["en-US"],
         model: "latest_long"
      }
   };

   const operation = await client.createRecognizer(recognizerRequest);
   const recognizer = operation[0].result;
   const recognizerName = recognizer.name;
   console.log(`Created new recognizer: ${recognizerName}`);
}

async function transcribeFile()
{
   const recognizerName = `projects/${projectId}/locations/global/recognizers/${recognizerId}`;
   const gcsUri = "gs://cloud-samples-data/speech/brooklyn_bridge.raw";

   const transcriptionRequest = {
      recognizer: recognizerName,
      uri: gcsUri,
      config: {
         explicitDecodingConfig: { // If you didn't set explicitDecodingConfig when creating the recognizer, you have to set it here.
            encoding: "LINEAR16",
            sampleRateHertz: 16000,
            audioChannelCount: 1
         }
      }
   };

   const response = await client.recognize(transcriptionRequest);
   for (const result of response[0].results)
   {
      console.log(`Transcript: ${result.alternatives[0].transcript}`);
   }
}

(async function main()
{
   await createRecognizer();
   await transcribeFile();
})();
