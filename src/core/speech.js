const speech = require("@google-cloud/speech").v1;

const projectId = "mindful-marking-432022-g6";
const recognizerId = "en123";

const client = new speech.SpeechClient();
const fs = require("fs");
var http = require("https");


async function transcribeFile()
{
   const filename = "./voice-message.ogg";
   const audio = {
      content: fs.readFileSync(filename).toString("base64")
   };
   http.get("https://cdn.discordapp.com/attachments/1273268746542383115/1276645983169548328/voice-message.ogg?ex=66ca48b9&is=66c8f739&hm=5f283c1e1896565392f845c6760fca5e413fafa6e73cff65cbe33f80f9763965&", function(res)
   {
      const result = new Promise();
      var waveform = [];
      res.on("data", function(chunk)
      {
         waveform.push(chunk);
      }).on("end", function()
      {
         //at this point data is an array of Buffers
         //so Buffer.concat() can make us a new Buffer
         //of all of them together
         var buffer = Buffer.concat(waveform);
         const transcriptionRequest_ = {
            audio: audio,
            config: {
               encoding: "OGG_OPUS",
               sampleRateHertz: 48000,
               //            audioChannelCount: 2,
               languageCode: "en-US"
            }
         };
         const transcriptionRequest = {
            audio: { content: buffer.toString("base64")},
            config: {
               encoding: "OGG_OPUS",
               sampleRateHertz: 48000,
               //           audioChannelCount: 2,
               languageCode: "en-US"
            }
         };

         client.recognize(transcriptionRequest).then(response=>
         {
            for (const result of response[0].results)
            {
               console.log(`Transcript: ${result.alternatives[0].transcript}`);
            }
         });
      });
   });
}

(async function main()
{
//   await createRecognizer();
   await transcribeFile();
})();
