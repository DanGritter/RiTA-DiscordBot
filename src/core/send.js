// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING,ARITY]
/* eslint-disable no-undef */
const colors = require("./colors");
const fn = require("./helpers");
const db = require("./db");
const logger = require("./logger");
const discord = require("discord.js");
const webHookName = "Translator Messaging System";

// ---------------------
// Send Data to Channel
// ---------------------

// eslint-disable-next-line complexity
module.exports = function(data)
{
   // ----------------------------
   // Regex Statments for Emoji's
   // ----------------------------

   function languageRegex(data)
   {
      // Remove Whitespaces
      data.text = data.text.replace(/<.+?>/g, tag => tag.replace(/\s+/g, ""));
      //  Remove translated numeral keywords
      data.text = data.text.replace(/millions/gmi, ``);
      data.text = data.text.replace(/milioni/gmi, ``);
      // Commas Replacement
      const regex10 = /(?<=<[^<>]*?),+(?=[^<>]*>)/gm;
      data.text = data.text.replace(regex10, ``);
      // Period Replacement
      const regex11 = /(?<=<[^<>]*?)\.+(?=[^<>]*>)/gm;
      data.text = data.text.replace(regex11, ``);
      //  Remove Exclamation marks
      data.text = data.text.replace(/<@!/gmi, `<@`);
      data.text = data.text.replace(/<!@/gmi, `<@`);
      //  Change formatted special characters to normal
      data.text = data.text.replace(/：/gmi, ":");
      data.text = data.text.replace(/，/gmi, ", ");
      data.text = data.text.replace(/、/gmi, ", ");
      data.text = data.text.replace(/！/gmi, "");
      data.text = data.text.replace(/<A/gmi, "<a");
      data.text = data.text.replace(/>/gmi, ">");
      data.text = data.text.replace(/</gm, "<");
      data.text = data.text.replace(/<А/gmi, "<a");
      data.text = data.text.replace(/＆/gmi, ``);
      data.text = data.text.replace(/></gm, `> <`);
      data.text = data.text.replace(/＃/gmi, "#");
      data.text = data.text.replace(/＃/gmi, "#");
      data.text = data.text.replace(/((\s?)(\*)(\s?))/gmis, "*");
      data.text = data.text.replace(/(?<=<[^<>]*?)([0-9]*)\s*@+(?=[^<>]*>)/gmi, "@$1");
   }

   if (data.author)
   {
      if (data.text)
      {
         languageRegex(data);
         data.text = data.text.replace(/<А/gmi, "<a");
         if (data.text.includes("<А" || "<a"))
         {
            const regex1 = /<(a)([:?\s:\s[a-z0-9ЁёА-я_A-Z\s\u00C0-\u017F]+\S*:\s*)([0-9\s]+)>/gmi;
            const str1 = data.text;
            const subst1 = `<a:customemoji:$3>`;
            data.text = str1.replace(regex1, subst1);
         }
         //   if a combination of animated emojis and normal custom emojis
         if (!data.text.includes("<a") && data.text.includes("<:"))
         {
            const subst5 = "<:customemoji:$3>";
            const str5 = data.text;
            const regx5 = /<:([:?\s:\s[a-z0-9ЁёА-я_A-Z\s\u00C0-\u017F]+\S*(:)\s*)([0-9\s]+)>/gmi;
            data.text = str5.replace(regx5, subst5);
         }
         if (data.text.includes("<a") && data.text.includes("<:"))
         {
            const regex20 = /<(a)([:?\s:\s[a-z0-9ЁёА-я_A-Z\s\u00C0-\u017F]+\S*:\s*)([0-9\s]+)>/gmi;
            const regex30 = /<:([:?\s:\s[a-z0-9ЁёА-я_A-Z\s\u00C0-\u017F]+\S*(:)\s*)([0-9\s]+)>/gmi;
            data.text.replace(regex20, "<a:customemoji:$3>");
            data.text.replace(regex30, "<:customemoji:$3>");
         }
      }
   }

   // ----------------------------------------------------
   // The first time this runs after a reset it will
   // always send as Off state as set.EmbedVar = "",
   // Alot of this is debug code, but left in for testing
   // ----------------------------------------------------


   const guildValue = data.message.guild.id;

   function ignoreMessage()
   {
      const ignoreMessageEmbed = new discord.EmbedBuilder()
         .setColor(colors.get(data.color))
         .setTitle("**Bot Alert**\n")
         .setAuthor({name: data.bot.username,
            iconURL: data.bot.displayAvatarURL()})
         .setDescription(data.text)
         .setTimestamp()
         .setFooter({text: "𝗕𝗼𝘁𝗵 𝗺𝗲𝘀𝘀𝗮𝗴𝗲𝘀  𝘄𝗶𝗹𝗹 𝘀𝗲𝗹𝗳-𝗱𝗲𝘀𝘁𝗿𝘂𝗰𝘁 𝗶𝗻 10 𝘀𝗲𝗰𝗼𝗻𝗱𝘀"});
      message.reply({embeds: [ignoreMessageEmbed]}).then(msg =>
      {
         setTimeout(function() { msg.delete();},10000);
      });
   }

   // --------------------
   // Primary If Statment
   // --------------------

   if (false) // eslint-disable-line no-constant-condition
   {
      embedOn(data);
   }
   else
   {
      embedOff(data);
   }
};

// ----------------------------
// Embedded Variable "On" Code
// ----------------------------

const embedOn = function(data)
{
   const sendBox = function(data)
   {
      if (data.author)
      {
         data.author = {
            name: data.author.username,
            //eslint-disable-next-line camelcase
            icon_url: data.author.displayAvatarURL
         };
      }

      if (data.text && data.text.length > 1)
      {
         if (!data.author)
         {
            message.delete(5000);
            const botEmbedOn = new discord.EmbedBuilder()
               .setColor(colors.get(data.color))
               .setAuthor({name: data.bot.username,
                  iconURL: data.bot.displayAvatarURL()})
               .setDescription(data.text)
               .setTimestamp()
               .setFooter({text: "This message will self-destruct in one minute"});

            message.channel.send({embeds: [botEmbedOn]}).then(msg =>
            {
               setTimeout(function() {msg.delete();},60000);
            });
         }
         else
         if (data.channel)
         {
            data.channel.send({
               embeds: [{
                  title: data.title,
                  fields: data.fields,
                  author: data.author,
                  color: colors.get(data.color),
                  description: data.text,
                  footer: data.footer
               }]
            }).then(() =>
            {
               sendEmbeds(data);
               sendAttachments(data);
            }).catch(err =>
            {
               var errMsg = err;
               logger("dev", err);

               // ------------------------
               // Error for long messages
               // ------------------------

               if (err.code && err.code === 50035)
               {
                  if (data.channel)
                  {
                     data.channel.send(":warning:  Message is too long.");
                  }
                  else
                  {
                     logger("dev",`data.channel not defined: ${data.channel}`);
                  }
               }

               // -----------------------------------------------------------
               // Handle error for users who cannot recieve private messages
               // -----------------------------------------------------------

               if (err.code && err.code === 50007 && data.origin)
               {
                  const badUser = data.channel.recipient;
                  errMsg = `@${badUser.username}#${badUser.discriminator}\n` + err;

                  db.removeTask(data.origin.id, `@${badUser.id}`, function(er)
                  {
                     if (er)
                     {
                        return logger("error", er);
                     }

                     return data.origin.send(
                        `:no_entry: User ${badUser} cannot recieve direct messages ` +
                           `by bot because of **privacy settings**.\n\n__Auto ` +
                           `translation has been stopped. To fix this:__\n` +
                           "```prolog\nServer > Privacy Settings > " +
                           "'Allow direct messages from server members'\n```"
                     );
                  });
               }

               logger("error", errMsg);
            });
         }
         else
         {
            logger("dev",`data.channel not defined: ${data.channel}`);
         }
      }
      else if (data.attachments.size > 0)
      {
         sendAttachments(data);
      }
   };

   // -----------------------------------------------
   // Resend embeds from original message
   // Only if content is forwared to another channel
   // -----------------------------------------------

   const sendEmbeds = function(data)
   {
      if (data.forward && data.embeds && data.embeds.length > 0)
      {
         const maxEmbeds = data.config.maxEmbeds;

         if (data.embeds.length > maxEmbeds)
         {
            sendBox({
               channel: data.channel,
               text: `:warning:  Cannot embed more than ${maxEmbeds} links.`,
               color: "warn"
            });

            data.embeds = data.embeds.slice(0, maxEmbeds);
         }

         for (let i = 0; i < data.embeds.length; i++)
         {
            if (data.channel)
            {
               data.channel.send(data.embeds[i].url);
            }
            else
            {
               logger("dev",`data.channel not defined: ${data.channel}`);
            }
         }
      }
   };

   // -------------------
   // Resend attachments
   // -------------------

   const sendAttachments = function(data)
   {
      var attachments = data.attachments;

      if (data.forward && attachments && attachments.size > 0)
      {
         const maxAtt = data.config.maxEmbeds;

         if (attachments.size > maxAtt)
         {
            sendBox({
               channel: data.channel,
               text: `:warning:  Cannot attach more than ${maxAtt} files.`,
               color: "warn"
            });
            attachments = attachments.slice(0, maxAtt);
         }
         attachments.every(attachment =>
         {
            console.log(typeof attachment);
            if (attachment.url)
            {
               const attachmentObj = new discord.AttachmentBuilder().
                  setFile(attachment.url).
                  setName(attachment.name);
               if (data.channel)
               {
                  data.channel.send(attachmentObj);
               }
               else
               {
                  logger("dev",`data.channel not defined: ${data.channel}`);
               }
            }
            else
            {
               const attachmentObj = attachment;
               if (data.channel)
               {
                  data.channel.send(attachmentObj);
               }
               else
               {
                  logger("dev",`data.channel not defined: ${data.channel}`);
               }
            }
            return true;
         });
      }
   };

   checkPerms(data, sendBox);
};

// -----------------------------
// Embedded Variable "Off" Code
// -----------------------------

const embedOff = function(data)
{
   // -------------
   // Create Files
   // -------------

   function createFiles(attachments)
   {
      if (!attachments || attachments.size === 0)
      {
         return;
      }
      const files = [];
      attachments.every(attachment =>
      {
         if (attachment.url)
         {
            const attachmentObj = new discord.AttachmentBuilder()
               .setFile(attachment.url)
               .setName(attachment.name);
            files.push(attachmentObj);
         }
         else
         {
            const attachmentObj = attachment;
            files.push(attachmentObj);
         }
         return true;
      });
      return files;
   }

   // ---------------------
   // Send Webhook Message
   // ---------------------
   function sendWebhookMessage(webhook, data)
   {
      var ref = null;
      const files = createFiles(data.attachments);
      if (!data.author)
      {
         if (data.text === undefined)
         {
            if (data.reference) {ref = data.reference.messageId;}
            webhook.send({content: "",
               color: colors.get(data.color),
               username: data.bot.username,
               avatarURL: data.bot.displayAvatarURL(),
               //               reply: {messageReference: ref},
               files: files
            });
         }
         else
         {
            const botEmbedOff = new discord.EmbedBuilder()
               .setColor(colors.get(data.color))
               .setAuthor({name: data.bot.username,
                  iconURL: data.bot.displayAvatarURL()})
               .setDescription(data.text)
               .setTimestamp()
               .setFooter({text: "This message will self-destruct in one minute"});

            if (data.channel)
            {
               data.channel.send({embeds: [botEmbedOff]}).then(msg =>
               {
                  setTimeout(function() {msg.delete();},60000);
               });
            }
            else
            {
               logger("dev",`data.channel not defined: ${data.channel}`);
            }
         }
      }
      else
      {
         let username = null;
         let avatarURL = null;
         if (data.author)
         {
            if (data.author.nickname)
            {
               username = data.author.nickname;
            }
            else
            {
               username = data.author.displayName;
            }
            avatarURL = data.author.displayAvatarURL();
         }
         if (data.reference) {ref = data.reference.messageId;}
         let content = data.text;
         if (data.link)
         {
            if (content)
            {
               content = content+` [(^)](${data.link})`;
            }
            else
            {
               content = `[(^)](${data.link})`;
            }
         }
         if (content.length <= 2000)
         {
            webhook.send({content: content,
               color: colors.get(data.color),
               username: username,
               avatarURL: avatarURL,
               //            reply: {messageReference: ref},
               files: files
            });
         }
         else
         {
            let pos = 0;
            const clength = content.length;
            while (pos < clength)
            {
               let send = "";
               if (content.length > 2000)
               {
                  const index = content.substring(0,2000).lastIndexOf(" ");
                  send = content.substring(0,index);
                  content = content.substring(index);
               }
               else {send = content;}
               if (pos == 0)
               {
                  webhook.send({content: send,
                     color: colors.get(data.color),
                     username: username,
                     avatarURL: avatarURL,
                     //            reply: {messageReference: ref},
                     files: files
                  });
               }
               else
               {
                  webhook.send({content: send,
                     color: colors.get(data.color),
                     username: username,
                     avatarURL: avatarURL});
               }
               pos += send.length;
            }
         }
      }
   }

   // ---------------------
   // Send Data to Channel
   // ---------------------

   const sendBox = function(data)
   {
      const channel = data.channel;
      let color = colors.get(data.color);
      let avatarURL;
      if (data.author && data.author.displayAvatarURL())
      {
         avatarURL = data.author.displayAvatarURL();
      }
      if (!channel) {return console.log("Channel not specified.");}
      // Sets the color of embed message but no embed message used so thus unused.
      if (!color) {color = colors.get(data.color);}
      if (!avatarURL) {avatarURL = data.author;}

      // -----------------------------
      // Webhook Creation and Sending
      // -----------------------------

      if (data.channel.type === "dm")
      {
         const embed = new discord.Embed()
            .setAuthor({name: message.member.username || data.author.name,
               iconURL: data.author.displayAvatarURL()})
            .setColor(colors.get(data.color))
            .setDescription(data.text)
            .setFooter({text: data.footer.text});
         sendAttachments(data);
         if (data.channel)
         {
            data.channel.send({embeds: [embed]});
         }
         else
         {
            logger("dev",`data.channel not defined: ${data.channel}`);
         }
      }
      else
      {
         channel.fetchWebhooks()
            .then(webhooks =>
            {
               // You can rename 'Webhook' to the name of your bot if you like, people will see if under the webhooks tab of the channel.
               existingWebhook = webhooks.find(x => x.name === webHookName);

               if (!existingWebhook)
               {
                  channel.createWebhook({name: webHookName,
                     avatar: avatarURL})
                     .then(newWebhook =>
                     {
                        // Finally send the webhook
                        sendWebhookMessage(newWebhook, data);
                     });
               }
               else
               {
                  existingWebhook.messages = channel.messages;
                  sendWebhookMessage(existingWebhook, data);
               }
            });
      }
   };

   // -------------------
   // Resend attachments
   // -------------------

   const sendAttachments = function(data)
   {
      var attachments = data.attachments;

      if (data.forward && attachments && attachments.size > 0)
      {
         const maxAtt = data.config.maxEmbeds;

         if (attachments.size > maxAtt)
         {
            sendBox({
               channel: data.channel,
               text: `:warning:  Cannot attach more than ${maxAtt} files.`,
               color: "warn"
            });
            attachments = attachments.slice(0, maxAtt);
         }

         attachments.every(attachment =>
         {
            if (attachment.url)
            {
               const attachmentObj = new discord.AttachmentBuilder()
                  .setFile(attachment.url)
                  .setName(attachment.name);
               if (data.channel)
               {
                  data.channel.send({files: [attachmentObj]});
               }
               else
               {
                  logger("dev",`data.channel not defined: ${data.channel}`);
               }
            }
            else
            if (data.channel)
            {
               const attachmentObj = attachment;
               data.channel.send({files: [attachmentObj]});
            }
            else
            {
               logger("dev",`data.channel not defined: ${data.channel}`);
            }
            return true;
         });
      }
   };

   checkPerms(data, sendBox);
};

// -----------------
// Permission Check
// -----------------

// This is the last step before the message is send, each function ends here.
const checkPerms = function(data, sendBox)
{
   // ------------------------------------------------------------------------
   // Analyze Data and determine sending style (system message or author box)
   // ------------------------------------------------------------------------

   //eslint-disable-next-line complexity
   {
      var sendData = {
         title: data.title,
         fields: data.fields,
         config: data.config,
         channel: data.message.channel,
         color: data.color,
         text: data.text,
         footer: data.footer,
         embeds: data.embeds,
         attachments: data.attachments,
         forward: data.forward,
         origin: null,
         reference: data.message.reference,
         link: data.message.url,
         bot: data.bot
      };
   }

   // ---------------------------------------------------
   // Notify server owner if bot cannot write to channel
   // ---------------------------------------------------

   if (!data.canWrite)
   {
      const writeErr =
         ":no_entry:  **Translate bot** does not have permission to write at " +
         `the **${sendData.channel.name}** channel on your server **` +
         `${sendData.channel.guild.name}**. Please fix.`;

      return sendData.channel.guild.owner
         .send(writeErr)
         .catch(err => logger("error", err));
   }
   function doSend(forwardChannel,err)
   {
      // ----------------------------------------------
      // Check if bot can write to destination channel
      // ----------------------------------------------
      if (err)
      {
         return logger("error",err);
      }

      var canWriteDest = true;
      if (forwardChannel.type === "text")
      {
         canWriteDest = fn.checkPerm(
            forwardChannel.guild.me,
            forwardChannel,
            "SEND_MESSAGES"
         );
      }

      if (canWriteDest)
      {
         sendData.origin = sendData.channel;
         sendData.channel = forwardChannel;
      }

      // ----------------------------------
      // Error if bot cannot write to dest
      // ----------------------------------

      else
      {
         sendData.footer = null;
         sendData.embeds = null;
         sendData.color = "error";
         sendData.text =
                  ":no_entry:  Bot does not have permission to write at the " +
                  `<#${forwardChannel.id}> channel.`;

         // -------------
         // Send message
         // -------------
         return sendBox(sendData);
      }
   }
   function sendErr(err)
   {
      logger("error",err);
      sendData.footer = {text: err};
      sendData.embeds = null;
      sendData.color = "error";
      sendData.text = ":warning:  Invalid channel.";

      // -------------
      // Send message
      // -------------

      return sendBox(sendData);
   }

   if (data.forward)
   {
      const forwardChannel = data.client.channels.cache.get(data.forward);

      if (forwardChannel === undefined)
      {
         data.client.channels.fetch(data.forward).then(channel => doSend(channel)).catch(error => sendErr(error));
      }
      else
      {
         doSend(forwardChannel);
      }
   }

   if (data.showAuthor)
   {
      sendData.author = data.message.author;

      if (data.author)
      {
         sendData.author = data.author;
      }
   }

   // -------------
   // Send message
   // -------------
   return sendBox(sendData);
};
