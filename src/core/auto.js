// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const translate = require("./translate");
const logger = require("./logger");
const botSend = require("./send");
const fn = require("./helpers");
const auth = require("./auth");
// Imports the Google Cloud client libraries
const vision = require("@google-cloud/vision");

// Creates a client
const visionClient = new vision.ImageAnnotatorClient({key: auth.gcpapikey});

// -----------------
// Get data from db
// -----------------

module.exports = function(data)
{
   if (data.err)
   {
      return logger("error", data.err);
   }

   if (data.rows.length > 0)
   {
      // ----------------------------------------------
      // Add !i to end of message to ignore it instead
      // ----------------------------------------------

      if (
         data.message.content.endsWith("!i")
      )
      {
         return data.message.react("➖").catch((err) =>
         {
            return logger("dev", `${err}\n\n'# Cannot react`);
         });
      }

      data.proccess = true;

      for (var i = 0; i < data.rows.length; i++)
      {
         analyzeRows(data, i);
      }
   }
};

// ---------------------
// Analyze rows in loop
// ---------------------

const analyzeRows = function(data, i)
{
   const row = data.rows[i];

   // -------------------------------
   // Set forward channel for sender
   // -------------------------------

   if (row.dest !== data.message.channel.id)
   {
      data.forward = row.dest;
      data.embeds = data.message.embeds;
      data.attachments = data.message.attachments;

      if (data.message.channel.type === "dm")
      {
         const replyIndex = data.message.content.indexOf(":");
         const reply = data.message.content.slice(0, replyIndex);
         const replyCon = data.message.content.slice(replyIndex + 1);

         if (reply === row.reply)
         {
            data.proccess = true;
            data.message.content = replyCon;
         }
         else
         {
            data.proccess = false;
         }
      }
   }

   // ------------------------
   // Set translation options
   // ------------------------

   data.translate = {
      original: data.message.content,
      to: { valid: [{iso: row.LangTo}] },
      from: { valid: [{iso: row.LangFrom}] }
   };

   // ------------------
   // Start translation
   // ------------------

   startTranslation(data, i, row);
};


// ------------------
// Start translation
// ------------------

const startTranslation = function(data, i, row)
{
   const replyID = row.reply;

   // ---------------------------------
   // Add footer to forwarded messages
   // ---------------------------------

   data.footer = {
      text: "via "
   };

   if (data.message.channel.type === "text")
   {
      data.footer.text += "#" + data.message.channel.name;
   }

   if (data.message.channel.type === "dm")
   {
      data.footer.text += "DM";
   }

   const footerOriginal = data.footer;

   // -------------------
   // Sending to user/DM
   // -------------------

   if (row.dest.startsWith("@"))
   {
      const footerExtra = {
         text: data.footer.text +
         ` ‹ ${data.message.guild.name} | reply with ${replyID}:`,
         //eslint-disable-next-line camelcase
         icon_url: data.message.guild.iconURL
      };

      const userID = row.dest.slice(1);

      fn.getUser(data.client, userID, user =>
      {
         if (user && user.createDM)
         {
            user.createDM().then(dm =>
            {
               data.footer = footerExtra;
               data.forward = dm.id;
               sendTranslation(data);
            }).catch(err => logger("error", err));
         }
      });
   }

   // -------------------------
   // Sending to other channel
   // -------------------------

   else
   {
      data.footer = footerOriginal;
      sendTranslation(data);
   }
};

// --------------
// Proccess task
// --------------

const sendTranslation = async function(data)
{
// const bucketName = 'Bucket where the file resides, e.g. my-bucket';
// const fileName = 'Path to file within bucket, e.g. path/to/image.png';

   // Performs text detection on the gcs file
   if (data.proccess)
   {
      data.author = data.message.member;
      if ( data.message.attachments && 
         data.message.attachments.size > 0
      )
      {
         const promises = [];
         let promiseIndex = 0;
         data.message.attachments.each(function(attachment,index)
         {
            const promise = visionClient.textDetection(attachment.url).then(result =>
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
               const attachment = data.message.attachments.get(index);
               attachment.annotations = paragraphs;
               data.message.attachments.set(index,attachment);
            });
            promises[promiseIndex++] = promise;
         });
         Promise.allSettled(promises).then(value =>
         {
            data.showAuthor = true;
            // -------------
            // Send message
            // -------------
            return translate(data,botSend);
         });
         return;
      }

      // -------------
      // Send message
      // -------------

      return translate(data,botSend);
   }
};
