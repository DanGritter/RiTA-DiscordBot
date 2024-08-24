// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const logger = require("./logger");
const auth = require("./auth");
var http = require("https");
// Imports the Google Cloud client libraries
const vision = require("@google-cloud/vision");
const speech = require("@google-cloud/speech").v1;

const projectId = "mindful-marking-432022-g6";
const client = new speech.SpeechClient();


// Creates a client
const visionClient = new vision.ImageAnnotatorClient({key: auth.gcpapikey});

// --------------------------------------
// Helper Functions & Buffer end checker
// --------------------------------------

exports.bufferEnd = function(arrOriginal, arrFinal)
{
   if (arrOriginal.length === arrFinal.length)
   {
      return true;
   }
   return false;
};

// ----------------------
// Check user permission
// ----------------------

exports.checkPerm = function(member, channel, perm)
{
   return channel.permissionsFor(member).has(perm);
};

// ------------------------------------
// Get key name of object by its value
// ------------------------------------

exports.getKeyByValue = function (object, value)
{
   return Object.keys(object).find(key => object[key] === value);
};

// -----------------------------
// Remove duplicates from array
// -----------------------------

exports.removeDupes = function (array)
{
   return Array.from(new Set(array));
};

// ------------------------------
// Replace all matches in string
// ------------------------------

exports.replaceAll = function(str, search, replacement)
{
   return str.replace(new RegExp(search, "g"), replacement);
};

// ---------------------------
// Sort array by specific key
// ---------------------------

exports.sortByKey = function(array, key)
{
   return array.sort(function(a, b)
   {
      var x = a[key];
      var y = b[key];
      return x < y ? -1 : x > y ? 1 : 0;
   });
};

// -----------------------------------
// Split string to array if not array
// -----------------------------------

exports.arraySplit = function(input, sep)
{
   if (input.constructor === Array && input.length > 0)
   {
      return input;
   }
   return input.split(sep);
};

// -----------------------
// Split string to chunks
// -----------------------

exports.chunkString = function(str, len)
{
   var _size = Math.ceil(str.length/len);
   var _ret = new Array(_size);
   var _offset;

   for (var _i=0; _i<_size; _i++)
   {
      _offset = _i * len;
      _ret[_i] = str.substring(_offset, _offset + len);
   }

   return _ret;
};

// ----------------------------------
// Get sum of array values (numbers)
// ----------------------------------

exports.arraySum = function(array)
{
   return array.reduce((a, b) =>a + b, 0);
};

// -----------------------
// Get Highest Role Color
// -----------------------

exports.getRoleColor = function(member)
{
   if (member)
   {
      return member.displayHexColor;
   }
};

// ---------
// Get user
// ---------
exports.getGuild = function(client, guildID, cb)
{
   const guild = client.guilds.cache.get(guildID);
   if (guild)
   {
      return cb(guild);
   }
   client.guilds.fetch(guildID).then(cb).catch(err =>
   {
      cb(null,err);
      return logger("error", err);
   });
};

exports.getUser = function(client, userID, cb)
{
   const user = client.users.cache.get(userID);

   if (user)
   {
      return cb(user);
   }

   // user not in cache, fetch 'em

   client.users.fetch(userID).then(cb).catch(err =>
   {
      cb(null,err);
      return logger("error", err);
   });
};

// ------------
// Get channel
// ------------

exports.getChannel = function(client, channelID, userID, cb)
{
   const channel = client.channels.cache.get(channelID);
   if (channel)
   {
      return cb(channel);
   }

   // not in cache, create DM
   client.channels.fetch(channelID).then(cb).catch(err =>
   {
      cb(null,err);
   });
};

// ------------
// Get message
// ------------

exports.getMessage = function(client, messageID, channelID, userID, cb)
{
   module.exports.getChannel(client, channelID, userID, async(channel,err) =>
   {
      if (err)
      {
         return logger("error", err);
      }
      const message = channel.messages.cache.get(messageID);

      if (message)
      {
         return cb(message);
      }
      // message not in channel cache

      channel.messages.fetch(messageID).then(cb).catch(err =>
      {
         return cb(null, err);
      });
   });
};

exports.getOriginalMessage = function(client,data,user,cb)
{
   if (data.message.author.bot)
   {
      module.exports.getMessage(
         client,
         data.message.id,
         data.message.channel.id,
         user,
         (message, err) =>
         {
            let origMessage = message.content;
            if (origMessage)
            {
               const indexoflink = origMessage.lastIndexOf("(^)");
               origMessage = origMessage.substring(indexoflink);
               let indexofchannel = origMessage.indexOf("channels/")+9;
               indexofchannel = origMessage.indexOf("/",indexofchannel)+1;
               const indexoflinkend = origMessage.lastIndexOf(")");
               const indexofmessage = origMessage.lastIndexOf("/");
               const messageId = origMessage.substring(indexofmessage+1,indexoflinkend);
               const channelId = origMessage.substring(indexofchannel,indexofmessage);
               module.exports.getMessage(
                  client,
                  messageId,
                  channelId,
                  user, cb);
            }
         });
   }
};
exports.textDetection = function (url,cb)
{
   return visionClient.textDetection(url).then(result =>
   {
      const detections = result[0].textAnnotations;
      const paragraphs = [];
      paragraphs[0] = {};
      let paragraph_index = 0;
      let left_p = 0;
      let top_p = 0;
      let right_p = 0;
      let bottom_p = 0;
      detections.slice(1).forEach(text =>
      {
         const coords = text.boundingPoly.vertices;
         if (left_p === 0) {left_p = coords[0].x;}
         if (top_p === 0) {top_p = coords[0].y;}
         if (right_p === 0) {right_p = coords[2].x;}
         if (bottom_p === 0) {bottom_p = coords[2].y;}

         const left_c = coords[0].x;
         const top_c = coords[0].y;
         const right_c = coords[2].x;
         const bottom_c = coords[2].y;

         if (top_c >= top_p-2 && bottom_c <= bottom_p+2)
         {
            if (paragraphs[paragraph_index].text)
            {
               paragraphs[paragraph_index].text += " " + text.description;
            }
            else
            {
               paragraphs[paragraph_index].text = text.description;
            }
            right_p = right_c;
         }
         else
         {
            paragraphs[paragraph_index].vertices = {left: left_p,
               top: top_p,
               right: right_p,
               bottom: bottom_p};
            paragraph_index = paragraph_index + 1;
            paragraphs[paragraph_index] = {};
            left_p = coords[0].x;
            top_p = coords[0].y;
            right_p = coords[2].x;
            bottom_p = coords[2].y;
            paragraphs[paragraph_index].text = text.description;
         }
      });
      paragraphs[paragraph_index].vertices = {left: left_p,
         top: top_p,
         right: right_p,
         bottom: bottom_p};
      cb(paragraphs);
   }).catch(err =>
   {
      cb(null,err);
   });
};

exports.speechDetection = function(audio,lang,cb)
{
   const spromise = new Promise((resolve,reject)=>
   {
      console.log(`Input: audio`);
      http.get(audio, function(res)
      {
         var waveform = [];
         res.on("data", function(chunk)
         {
            waveform.push(chunk);
         }).on("end", function()
         {
            var buffer = Buffer.concat(waveform);
            const transcriptionRequest = {
               audio: { content: buffer.toString("base64")},
               config: {
                  encoding: "OGG_OPUS",
                  sampleRateHertz: 48000,
                  languageCode: lang
               }
            };
            client.recognize(transcriptionRequest).then(response =>
            {
               if (response[0].results.length > 0)
               {
                  const result = response[0].results[0];
                  console.log(`Transcript: ${result.alternatives[0].transcript}`);
                  cb(result.alternatives[0].transcript);
                  return resolve();
               }
               cb(null);
               return resolve();
            }).catch(err =>
            {
               cb(null,err);
               return reject();
            });
         });
      });
   });
   return spromise;
};

exports.processAttachments = function(data,cb)
{
   if (data.message.attachments &&
         data.message.attachments.size > 0
   )
   {
      const promises = [];
      let promiseIndex = 0;
      data.message.attachments.each(function(attachment,index)
      {
         if (!attachment.waveform)
         {
            const promise = module.exports.textDetection(attachment.url,(paragraphs,err) =>
            {
               if (err)
               {
                  console.log(err);
                  return;
               }
               const attachment = data.message.attachments.get(index);
               attachment.annotations = paragraphs;
               data.message.attachments.set(index,attachment);
            });
            promises[promiseIndex++] = promise;
         }
         else
         {
            const promise = module.exports.speechDetection(attachment.url,"en-US",(paragraphs,err) =>
            {
               if (err)
               {
                  console.log(err);
                  return;
               }
               const attachment = data.message.attachments.get(index);
               attachment.transcription = paragraphs;
               data.message.attachments.set(index,attachment);
            });
            promises[promiseIndex++] = promise;
         }
      });
      Promise.allSettled(promises).then(value =>
      {
         cb(data);
      });
      return;
   }

   cb(data);
};
