// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
const botSend = require("../core/send");
const langCheck = require("../core/lang.check");
const translate = require("../core/translate");
const fn = require("../core/helpers");
const logger = require("../core/logger");
const countryLangs = require("../core/country.langs");

// ----------------------------------------------------
// Translate a message through discord reaction (flag)
// ----------------------------------------------------

module.exports = function(data, user, client)
{
   // ---------------------
   // Get country by emoji
   // ---------------------

   const emoji = data.emoji.name;
   if (Object.prototype.hasOwnProperty.call(emoji && countryLangs,emoji))
   {
      // ------------------------------------------------
      // Stop proccessing if country has no langs / null
      // ------------------------------------------------

      if (!countryLangs[emoji].langs)
      {
         return;
      }

      // -----------------
      // Get message data
      // -----------------
      fn.getMessage(
         client,
         data.message.id,
         data.message.channel.id,
         user,
         (message, err) =>
         {
            if (err)
            {
               return logger("error", err);
            }

            // ignore bots

            if (message.author.bot)
            {
               return;
            }

            const flagExists = message.reactions.cache.get(emoji);
            // prevent flag spam

            if (flagExists.count > 1)
            {
               return;
            }
            // translate data
            data.translate = {
               original: message.content,
               to: langCheck(countryLangs[emoji].langs),
               from: langCheck("auto"),
               multi: true
            };
            if (message.member)
            {
               data.author = message.member;
            }
            else
            {
               data.author = message.author;
            }
            data.message = message;
            data.message.roleColor = fn.getRoleColor(message.member);
            data.canWrite = true;
            data.bot = client.user;
            fn.processAttachments(data, cbdata =>
            {
            // ------------------
            // Start translation
            // ------------------
               data.attachments = data.message.attachments;
               translate(data,botSend);
            });
         }
      );
   }
   else
   {
      fn.getOriginalMessage(client,data,user, (origMessage, err) =>
      {
         if (err)
         {
            console.log(err);
         }
         else
         {
            let emoji = null;
            if (data.emoji.id)
            {
               emoji = origMessage.guild.emojis.fetch(data.emoji.id).then(guildemoji =>
               {
                  origMessage.react(guildemoji);
               }
               );
            }
            else
            {
               emoji = data.emoji;
               origMessage.react(emoji);
            }
         }
      });
   }
};
