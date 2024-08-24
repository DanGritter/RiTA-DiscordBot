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
   //   const russian = "https://cdn.discordapp.com/attachments/1271618475064033330/1276697301368307783/voice-message.ogg?ex=66ca7884&is=66c92704&hm=40046de992a6cc70641aa139c2fbe21acd5962a64c3f7d23ae9e47b6be5ccefc&";
   const english = "https://cdn.discordapp.com/attachments/1273268746542383115/1276645983169548328/voice-message.ogg?ex=66ca48b9&is=66c8f739&hm=5f283c1e1896565392f845c6760fca5e413fafa6e73cff65cbe33f80f9763965&";
   const russian = "https://cdn.discordapp.com/attachments/1271618475064033330/1276699635557204039/voice-message.ogg?ex=66ca7ab1&is=66c92931&hm=2ccea750aee8e48e9115f6b802af9c60f2b9f1b633662a7f800c956681954b14&";
   http.get(russian, function(res)
   {
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
               languageCode: "ru"
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
