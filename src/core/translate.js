// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const {Translate} = require("@google-cloud/translate").v2;
const db = require("./db");
const botSend = require("./send");
const fn = require("./helpers");
const auth = require("./auth");
const discord = require("discord.js");
const translate = new Translate({key: auth.gcpapikey});
var Jimp = require("jimp");
// Creates a client
// ------------------------------------------
// Fix broken Discord tags after translation
// (Emojis, Mentions, Channels)
// ------------------------------------------


const translateFix = function(string)
{
   console.log("translateFix= "+string);
   const normal = /(<[@#!$%&*])\s*/gim;
   const nick = /(<[@#!$%&*]!)\s*/gim;
   const role = /(<[@#!$%&*]&)\s*/gim;

   return string.replace(normal, "$1")
      .replace(nick, "$1")
      .replace(role, "$1");
};

// ---------------------------------------
// Get user color for translated response
// ---------------------------------------

function getUserColor(data, callback)
{
   const fw = data.forward;
   const txt = data.text;
   const ft = data.footer;
   const usr = data.author;

   data.forward = fw;
   data.text = txt;
   data.footer = ft;
   data.author = usr;

   callback(data);
}

// --------------------------
// Translate buffered chains
// --------------------------

const bufferSend = function(arr, data, cb)
{
   const sorted = fn.sortByKey(arr, "time");
   sorted.forEach(msg =>
   {
      data.text = msg.text;
      data.color = msg.color;
      data.author = msg.author;
      data.showAuthor = true;

      // -------------
      // Send message
      // -------------

      cb(data);
   });
};

const bufferChains = function(data, from, cb)
{
   var translatedChains = [];

   data.bufferChains.forEach(chain =>
   {
      const chainMsgs = chain.msgs.join("\n");
      const to = data.translate.to.valid[0].iso;
      translate.translate(chainMsgs,
         {to: to,
            from:
         from}).then(res =>
      {
         const output = translateFix(res[1].data.translations[0].translatedText);
         if (data.everyone) output = "@everyone " + output;
         getUserColor(chain, function(gotData)
         {
            translatedChains.push({
               time: chain.time,
               color: gotData.color,
               author: gotData.author,
               text: output
            });

            if (fn.bufferEnd(data.bufferChains, translatedChains))
            {
               bufferSend(translatedChains, data,cb);
            }
         });
      });
   });
};

// ---------------------
// Invalid lang checker
// ---------------------

const invalidLangChecker = function(obj, callback)
{
   if (obj && obj.invalid && obj.invalid.length > 0)
   {
      return callback();
   }
};

// --------------------
// Update server stats
// --------------------

const updateServerStats = function(message)
{
   var id = "bot";

   if (message.channel.type === "text")
   {
      id = message.channel.guild.id;
   }

   db.increaseServers(id);
};


// ----------------
// Run translation
// ----------------
function processAttachments(data,opts,cb)
{
   if (data.attachments && data.attachments.size > 0)
   {
      const attachments = data.attachments;
      data.attachments = [];
      var promises = [];
      var promiseIndex = 0;
      attachments.each(function(attachment,index)
      {
         if (attachment.waveform)
         {
            if (attachment.annotations)
            {
               const promise = new Promise((resolve,reject) =>
               {
                  translate.translate(attachment.annotations,opts).then(res=>
                  {
                     if (data.text)
                     {
                        data.text += "\n" + res[1].data.translations[0].translatedText;
                     }
                     else
                     {
                        data.text = res[1].data.translations[0].translatedText;
                     }
                     return resolve();
                  });
               });
               promises[promiseIndex++] = promise;
            }
         }
         else
         if (attachment.annotations)
         {
            var loadedImage;
            var lightfont;
            var darkfont;

            const promise = new Promise((resolve,reject) =>
            {
               Jimp.read(attachment.url)
                  .then(function (image)
                  {
                     loadedImage = image;
                     return Jimp.loadFont("./fonts/ibmplexsansblack.fnt");
                  })
                  .then(function (font)
                  {
                     darkfont = font;
                     return Jimp.loadFont("./fonts/ibmplexsanswhite.fnt");
                  }).then(function (font)
                  {
                     lightfont = font;
                     var tpromises = [];
                     var tpromiseIndex = 0;
                     attachment.annotations.forEach(paragraph =>
                     {
                        const tpromise = translate.translate(paragraph.text,opts).then(res=>
                        {
                           const color = loadedImage.getPixelColor(paragraph.vertices.left,paragraph.vertices.top);
                           const rgba = Jimp.intToRGBA(color);
                           var matchedfont;
                           if ((rgba.r + rgba.g + rgba.b)/3 > 125)
                           {
                              matchedfont = darkfont;
                           }
                           else
                           {
                              matchedfont = lightfont;
                           }
                           const ttext = res[1].data.translations[0].translatedText;
                           const width = paragraph.vertices.right-paragraph.vertices.left;
                           const height = paragraph.vertices.bottom-paragraph.vertices.top;
                           const measureX = Jimp.measureText(matchedfont, ttext);
                           const measureY = 43;
                           const rect = new Jimp(measureX, measureY, color);
                           rect.print(matchedfont, 0, 0, ttext, measureX,measureY);
                           rect.resize(width,height);
                           loadedImage.composite(rect, paragraph.vertices.left, paragraph.vertices.top);
                        });
                        tpromises[tpromiseIndex++] = tpromise;
                     });
                     Promise.allSettled(tpromises).then(value =>
                     {
                        loadedImage.getBufferAsync(Jimp.MIME_PNG).then(buffer =>
                        {
                           data.attachments.push(new discord.AttachmentBuilder(buffer));
                           return resolve();
                        });
                     });
                  })
                  .catch(function (err)
                  {
                     console.error(err);
                  });
            });
            promises[promiseIndex++] = promise;
         }
         else
         {
            data.attachments.push(attachment);
         }
      });
      Promise.allSettled(promises).then(value =>
      {
         data.showAuthor = true;
         getUserColor(data,cb);
      });
   }
   else
   {
      data.showAuthor = true;
      getUserColor(data,cb);
   }
}

module.exports = function(data,cb) //eslint-disable-line complexity
{
   // -------------------------
   // Report invalid languages
   // -------------------------

   invalidLangChecker(data.translate.from, function()
   {
      data.color = "warn";
      data.text = ":warning:  Cannot translate from `" +
                  data.translate.from.invalid.join("`, `") + "`.";

      // -------------
      // Send message
      // -------------

      cb(null, data);
   });

   invalidLangChecker(data.translate.to, function()
   {
      data.color = "warn";
      data.text = ":warning:  Cannot translate to `" +
                  data.translate.to.invalid.join("`, `") + "`.";

      // -------------
      // Send message
      // -------------

      cb(null,data);
   });

   // -------------------------------------
   // Stop if there are no valid languages
   // -------------------------------------

   if (
      data.translate.to.valid.length < 1 ||
      data.translate.from.valid && data.translate.from.valid.length < 1
   )
   {
      return;
   }

   // --------------------------------
   // Handle value of `from` language
   // --------------------------------

   var from = data.translate.from;

   if (from !== "auto")
   {
      from = data.translate.from.valid[0].iso;
   }
   else
   {
      from = undefined;
   }

   // ---------------
   // Get guild data
   // ---------------

   var guild = null;

   if (data.message && data.message.channel.type === "text")
   {
      guild = data.message.channel.guild;
   }
   else
   if (data.interaction && data.interaction.channel.type === "text")
   {
      guild = data.interaction.channel.guild;
   }

   // ----------------------------------------------
   // Translate multiple chains (!translate last n)
   // ----------------------------------------------

   if (data.bufferChains)
   {
      return bufferChains(data, from, guild, cb);
   }

   // -----------------------------
   // Multi-translate same message
   // -----------------------------

   var translateBuffer = {};

   if (data.translate.multi && data.translate.to.valid.length > 1)
   {
      // ------------------------------------------
      // Stop if user requested too many languages
      // ------------------------------------------

      if (data.translate.to.valid.length > 6)
      {
         data.text = "Too many languages specified";
         data.color = "error";

         // -------------
         // Send message
         // -------------

         return cb(null,data);
      }

      // --------------------
      // Buffer translations
      // --------------------

      const bufferID = data.message.createdTimestamp;

      data.color = null;

      data.text = "";

      translateBuffer[bufferID] = {
         count: 0,
         len: data.translate.to.valid.length,
         text: "",
         update: function(newMsg, data)
         {
            this.count++;
            this.text += newMsg;

            if (this.count === this.len)
            {
               data.text = this.text;
               data.color = data.author.displayHexColor;
               data.showAuthor = true;
               getUserColor(data, cb);
            }
         }
      };

      data.translate.to.valid.forEach(lang =>
      {
         translate.translate(data.translate.original, {
            to: lang.iso,
            from: from
         }).then(res =>
         {
            const title = `\`\`\`LESS\n ${lang.name} (${lang.native}) \`\`\`\n`;
            const output = "\n" + title + translateFix(res[1].data.translations[0].translatedText) + "\n";
            return translateBuffer[bufferID].update(output, data);
         });
      });
      return;
   }

   // ------------------------
   // Send single translation
   // ------------------------

   const opts = {
      to: data.translate.to.valid[0].iso,
      from: from
   };

   const fw = data.forward;
   const ft = data.footer;
   const tdata = { ...data};
   // --------------------
   // Split long messages
   // --------------------
   if (tdata.translate.original.length > 0)
   {
      translate.translate(tdata.translate.original, opts).then(res =>
      {
         if (tdata.message)
         {
            updateServerStats(tdata.message);
	 }
         tdata.forward = fw;
         tdata.footer = ft;
         tdata.color = tdata.author ? tdata.author.displayHexColor : null;
         tdata.showAuthor = tdata.author ? true : false;
         let output = translateFix(res[1].data.translations[0].translatedText);
         if (tdata.everyone) output = "@everyone" + output;
         tdata.text = output;
         processAttachments(tdata,opts,cb);
      });
   }
   else
   {
      if (tdata.everyone) { 
         tdata.text = "@everyone";
         tdata.showAuthor = tdata.author ? true : false;
      }
      processAttachments(tdata,opts,cb);
   }
   return;
};
