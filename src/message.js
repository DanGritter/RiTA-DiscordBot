// -----------------
// Global variables
// -----------------

// codebeat:disable[LOC,ABC,BLOCK_NESTING]
const db = require("./core/db");
const fn = require("./core/helpers");
const cmdArgs = require("./commands/args");
const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, StringSelectMenuBuilder,StringSelectMenuOptionBuilder, TextInputStyle } = require("discord.js");

const alliances = ["wlf","TDS", "OGs", "555", "TIR", "CHO", "BYO", "PrO", "LoU", "TAR", "KSM", "WTF", "DIF", "OPG"];
const languages = ["English", "Russian", "German"];
const language_labels = ["English", "Русский", "Deutsch"];

module.exports.alliances = alliances;
module.exports.languages = languages;
module.exports.language_labels = language_labels;
// --------------------
// Listen for messages
// --------------------

//eslint-disable-next-line no-unused-vars
module.exports.messageHandler = async function(config, message, edited, deleted)
{
   module.exports.message = message;
   const client = message.client;
   const bot = client.user;

   // ------------------------
   // Ignore messages by bots
   // ------------------------

   if (message.author.bot)
   {
      return;
   }

   // -----------------------------------------
   // Embed member permissions in message data
   // -----------------------------------------

   if (message.channel.type === "text" && message.member)
   {
      message.isAdmin =
         message.member.permissions.has("ADMINISTRATOR");

      message.isManager =
         fn.checkPerm(message.member, message.channel, "MANAGE_CHANNELS");

      // Add role color
      message.roleColor = fn.getRoleColor(message.member);
   }

   // ------------
   // Data object
   // ------------

   const data = {
      client: client,
      config: config,
      bot: bot,
      message: message,
      canWrite: true
   };

   // ------------------
   // Proccess Commands
   // ------------------

   if (
      message.content.startsWith(config.translateCmd) ||
      message.content.startsWith(config.translateCmdShort) ||
      message.mentions.members.has(bot)
   )
   {
      return cmdArgs(data);
   }

   if (
      message.content.startsWith(config.clearCmd)
   )
   {
      if (message.isAdmin)
      {
         message.channel.bulkDelete(100, true).then((_message) =>
         {
            message.reply(`Bot cleared \`${_message.size}\` messages :broom:`).then((sent) =>
            {
               setTimeout(function ()
               {
                  sent.delete();
               }, 2500);
            });
         });
      }
      else
      {
         message.reply(`Not allowed to clear messages!`);
      }
      return;
   }
   if (
      message.content.startsWith(config.setupCmd)
   )
   {
      const alliance_options = [];
      const language_options = [];
      for (var e of alliances)
      {
         alliance_options.push(new StringSelectMenuOptionBuilder()
            .setLabel(e)
            .setValue(e));
      }
      for (var l in languages)
      {
         language_options.push(new StringSelectMenuOptionBuilder()
            .setLabel(language_labels[l])
            .setValue(languages[l]));
      }
      const user_role = new StringSelectMenuBuilder()
         .setCustomId("ap_alliances")
         .setPlaceholder("Select your alliance!").addOptions(alliance_options);
      const user_language = new StringSelectMenuBuilder()
         .setCustomId("ap_languages")
         .setPlaceholder("Select your language!").addOptions(language_options);
      const btnrow = new ActionRowBuilder().addComponents([
         user_role
      ]);
      const btnrow2 = new ActionRowBuilder().addComponents([
         user_language
      ]);
      const channel = message.guild.channels.cache.get("1272664168750911520");
      channel.messages.cache.forEach(message=>
      {
         channel.messages.delete(message);
      });
      channel.send({
         content: `Which alliance are you in?  In welcher Allianz bist du?  В каком альянсе вы состоите?`,
         components: [btnrow]
      });
      channel.send({
         content: `Which language do you speak? Welche Sprache sprechen Sie? На каком языке вы говорите?`,
         components: [btnrow2]
      });
      return;
   }
   // --------------------------
   // Check for automatic tasks
   // --------------------------
   return db.channelTasks(data);
};

