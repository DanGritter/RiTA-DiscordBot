// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const translate = require("./translate");
const logger = require("./logger");
const botSend = require("./send");
const fn = require("./helpers");
const auth = require("./auth");

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
      fn.processAttachments(data, cbdata =>
      {
         for (var i = 0; i < cbdata.rows.length; i++)
         {
            analyzeRows(cbdata, i);
         }
      });
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
   else
   {
      delete data.forward;
      data.embeds = data.message.embeds;
      data.attachments = data.message.attachments;
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

const sendTranslation = function(data)
{
   // Performs text detection on the gcs file
   if (data.proccess)
   {
      data.author = data.message.member;

      // -------------
      // Send message
      // -------------

      return translate(data,botSend);
   }
};
